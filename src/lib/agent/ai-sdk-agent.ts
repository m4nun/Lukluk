/**
 * AI SDK v7 ToolLoopAgent — replaces LangGraph StateGraph for Decision Agent.
 * Zero new deps: uses ai@7.0.14 (already installed).
 */

import { tool, ToolLoopAgent, isStepCount, type ToolSet } from "ai";
import { z } from "zod";
import type { PlanningRepository } from "./repository";
import { findPetPlaces } from "./map-places";
import { getModel } from "./ai-sdk-provider";
import { DECISION_SYSTEM_PROMPT } from "./graph";

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === maxRetries - 1) throw e;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

async function fetchDecisionContext(
  repo: PlanningRepository,
  profileId: string,
): Promise<string> {
  try {
    const profile = await repo.getProfile(profileId);
    if (!profile) return "";

    const [expenses, concerns, experiences] = await Promise.all([
      repo.getExpenses(profileId),
      repo.getConcerns(profileId),
      repo.getOwnerExperiences(profile.pet_type.id),
    ]);

    return [
      "",
      "--- CURRENT STATE (auto-loaded, DO NOT ask user for IDs) ---",
      `Pet: ${profile.pet_type.name} (${profile.pet_type.species})`,
      `Status: ${profile.decision_status}`,
      `Expenses (${expenses.length} items): ${JSON.stringify(expenses)}`,
      `Concerns (${concerns.length} items): ${JSON.stringify(concerns)}`,
      `Owner experiences (${experiences.length}): ${JSON.stringify(experiences)}`,
      "--- END STATE ---",
    ].join("\n");
  } catch {
    return "";
  }
}

function createAiSdkTools(
  repo: PlanningRepository,
  profileId: string,
): ToolSet {
  return {
    web_search: tool({
      description:
        "Search the web for current prices, products, or real-world info.",
      inputSchema: z.object({
        query: z.string().describe("Search query"),
      }),
      execute: async ({ query }) => {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) return "ERROR: Web search not configured.";

        const data = await retryWithBackoff(async () => {
          const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: apiKey,
              query,
              search_depth: "basic",
              max_results: 5,
            }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        });

        if (!data.results?.length)
          return "NO RESULTS: No relevant information found.";

        return [
          "SEARCH RESULTS:",
          ...data.results
            .slice(0, 5)
            .map(
              (r: { title: string; url: string; content: string }) =>
                `[${r.title}]\n${r.content}\nSource: ${r.url}`,
            ),
        ].join("\n\n");
      },
    }),

    search_pet_places: tool({
      description:
        "Show an interactive map of nearby pet places in Thailand.",
      inputSchema: z.object({
        query: z.string().describe("What the user is looking for"),
        location: z.string().describe("Location in Thailand"),
      }),
      execute: async ({ location }) => {
        try {
          const result = await findPetPlaces(location);
          if (!result)
            return `NO LOCATION FOUND: Could not geocode "${location}".`;
          if (!result.places.length)
            return `NO PLACES: No pet-related places found near ${location}.`;
          return JSON.stringify(result);
        } catch (e) {
          return `SEARCH FAILED: ${e instanceof Error ? e.message : String(e)}.`;
        }
      },
    }),

    update_expenses: tool({
      description:
        "Update the expense table. REPLACES all existing expenses.",
      inputSchema: z.object({
        expenses: z.array(
          z.object({
            category: z.enum(["initial", "monthly", "annual", "one_time"]),
            item: z.string().describe("Expense name"),
            amount_thb: z.number().int().min(0).describe("Amount in THB"),
            note: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ expenses }) => {
        await repo.replaceExpenses(profileId, expenses);
        const summary = expenses
          .map((e) => `${e.item}: ${e.amount_thb} THB`)
          .join(", ");
        return `SUCCESS: Updated ${expenses.length} expense items. ${summary}`;
      },
    }),

    update_concerns: tool({
      description:
        "Update the concern checklist. REPLACES all existing concerns.",
      inputSchema: z.object({
        concerns: z.array(
          z.object({
            concern_id: z.string().describe("Unique ID"),
            title: z.string().describe("Short title"),
            status: z.enum(["unresolved", "resolved", "not_applicable"]),
            note: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ concerns }) => {
        await repo.replaceConcerns(profileId, concerns);
        const summary = concerns
          .map((c) => `${c.title} (${c.status})`)
          .join(", ");
        return `SUCCESS: Updated ${concerns.length} concerns. ${summary}`;
      },
    }),

    update_decision_status: tool({
      description:
        "Update decision status. Call only when user explicitly states their decision.",
      inputSchema: z.object({
        status: z.enum([
          "exploring",
          "considering",
          "ready_to_buy",
          "not_a_fit",
          "already_have",
        ]),
      }),
      execute: async ({ status }) => {
        await repo.updateDecisionStatus(profileId, status);
        return `SUCCESS: Decision status updated to "${status}"`;
      },
    }),

    get_context: tool({
      description:
        "Get current planning data. Usually NOT needed - context is pre-injected.",
      inputSchema: z.object({}),
      execute: async () => {
        const planning = await repo.getProfile(profileId);
        if (!planning) return "ERROR: Planning profile not found.";

        const [expenses, concerns, experiences] = await Promise.all([
          repo.getExpenses(profileId),
          repo.getConcerns(profileId),
          repo.getOwnerExperiences(planning.pet_type.id),
        ]);

        return JSON.stringify({
          planning_profile: {
            name: planning.planning_name,
            status: planning.decision_status,
            pet_type: planning.pet_type,
          },
          expenses,
          concerns,
          owner_experiences: experiences,
        });
      },
    }),
  };
}

export interface AiSdkAgentResult {
  text: string;
  steps: Array<{
    type: "tool_call" | "tool_result";
    toolName: string;
    content: string;
  }>;
}

export async function runAiSdkAgent(
  repo: PlanningRepository,
  profileId: string,
  userMessage: string,
  previousMessages: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [],
): Promise<AiSdkAgentResult> {
  const context = await fetchDecisionContext(repo, profileId);
  const enrichedMessage = userMessage + context;

  const agent = new ToolLoopAgent({
    model: getModel(),
    instructions: DECISION_SYSTEM_PROMPT,
    tools: createAiSdkTools(repo, profileId),
    stopWhen: isStepCount(20),

  });

  const messages = [
    ...previousMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: [{ type: "text" as const, text: m.content }],
    })),
    {
      role: "user" as const,
      content: [{ type: "text" as const, text: enrichedMessage }],
    },
  ];

  const steps: AiSdkAgentResult["steps"] = [];

  const result = await agent.generate({
    messages,
    onToolExecutionStart: ({ toolCall }) => {
      steps.push({
        type: "tool_call",
        toolName: toolCall.toolName,
        content: `Calling ${toolCall.toolName}`,
      });
    },
    onToolExecutionEnd: ({ toolCall, toolOutput }) => {
      const content =
        "output" in toolOutput
          ? typeof toolOutput.output === "string"
            ? toolOutput.output
            : JSON.stringify(toolOutput.output)
          : JSON.stringify(toolOutput.error);
      steps.push({
        type: "tool_result",
        toolName: toolCall.toolName,
        content,
      });
    },
  });

  return { text: result.text, steps };
}
