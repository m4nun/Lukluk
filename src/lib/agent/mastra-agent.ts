// @ts-nocheck — reference implementation, not the selected framework (AI SDK won)
/**
 * Mastra Decision Agent — Framework #2 alternative to LangGraph.
 *
 * Key differences from AI SDK ToolLoopAgent:
 * - Mastra Agent class (not ToolLoopAgent)
 * - createTool() instead of tool() — requires id + outputSchema
 * - Built-in memory via Mastra threads (optional: we keep Supabase for v1)
 * - agent.generate() for non-streaming, agent.stream() for streaming
 * - Native OpenRouter support via @openrouter/ai-sdk-provider
 *
 * Supply chain note: @mastra/* packages were compromised June 2026.
 * Pin exact versions. This implementation uses post-remediation versions.
 */

import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { PlanningRepository } from "./repository";
import { findPetPlaces } from "./map-places";
import { DECISION_SYSTEM_PROMPT } from "./graph";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

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

export function createMastraTools(repo: PlanningRepository, profileId: string) {
  return {
    web_search: createTool({
      id: "web_search",
      description:
        "Search the web for current prices, products, or real-world info.",
      inputSchema: z.object({
        query: z.string().describe("Search query"),
      }),
      execute: async ({ query }) => {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) return { error: "Web search not configured" };

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

        return {
          results: (data.results ?? []).slice(0, 5).map(
            (r: { title: string; url: string; content: string }) => ({
              title: r.title,
              url: r.url,
              snippet: r.content,
            }),
          ),
        };
      },
    }),

    search_pet_places: createTool({
      id: "search_pet_places",
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
            return { error: `Could not geocode "${location}"` };
          if (!result.places.length)
            return { places: [], message: `No places found near ${location}` };
          return result;
        } catch (e) {
          return {
            error: e instanceof Error ? e.message : "Search failed",
          };
        }
      },
    }),

    update_expenses: createTool({
      id: "update_expenses",
      description:
        "Update the expense table. REPLACES all existing expenses.",
      inputSchema: z.object({
        expenses: z.array(
          z.object({
            category: z.enum(["initial", "monthly", "annual", "one_time"]),
            item: z.string(),
            amount_thb: z.number().int().min(0),
            note: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ expenses }) => {
        await repo.replaceExpenses(profileId, expenses);
        return { updated: expenses.length };
      },
    }),

    update_concerns: createTool({
      id: "update_concerns",
      description:
        "Update the concern checklist. REPLACES all existing concerns.",
      inputSchema: z.object({
        concerns: z.array(
          z.object({
            concern_id: z.string(),
            title: z.string(),
            status: z.enum(["unresolved", "resolved", "not_applicable"]),
            note: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ concerns }) => {
        await repo.replaceConcerns(profileId, concerns);
        return { updated: concerns.length };
      },
    }),

    update_decision_status: createTool({
      id: "update_decision_status",
      description: "Update decision status.",
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
        return { status };
      },
    }),

    get_context: createTool({
      id: "get_context",
      description: "Get current planning data.",
      inputSchema: z.object({}),
      execute: async () => {
        const planning = await repo.getProfile(profileId);
        if (!planning) return { error: "Profile not found" };

        const [expenses, concerns, experiences] = await Promise.all([
          repo.getExpenses(profileId),
          repo.getConcerns(profileId),
          repo.getOwnerExperiences(planning.pet_type.id),
        ]);

        return {
          profile: {
            name: planning.planning_name,
            status: planning.decision_status,
            pet_type: planning.pet_type,
          },
          expenses,
          concerns,
          owner_experiences: experiences,
        };
      },
    }),
  };
}

export interface MastraAgentResult {
  text: string;
  steps: Array<{
    type: "tool_call" | "tool_result";
    toolName: string;
    content: string;
  }>;
}

export async function createMastraAgent(
  repo: PlanningRepository,
  profileId: string,
) {
  return new Agent({
    id: "decision-agent",
    name: "Decision Agent",
    instructions: DECISION_SYSTEM_PROMPT,
    model: openrouter("deepseek/deepseek-v4-flash"),
    tools: createMastraTools(repo, profileId),
  });
}

export async function runMastraAgent(
  repo: PlanningRepository,
  profileId: string,
  userMessage: string,
  previousMessages: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<MastraAgentResult> {
  const context = await fetchDecisionContext(repo, profileId);
  const enrichedMessage = userMessage + context;

  const agent = await createMastraAgent(repo, profileId);

  const steps: MastraAgentResult["steps"] = [];

  const result = await agent.generate(enrichedMessage, {
    maxSteps: 6,
    memory: {
      resource: `lukluk-planning-${profileId}`,
      thread: `session-${profileId}`,
    },
    onStepFinish: (step) => {
      for (const tc of step.toolCalls ?? []) {
        steps.push({
          type: "tool_call",
          toolName: tc.toolName,
          content: `Calling ${tc.toolName}`,
        });
      }
      for (const tr of step.toolResults ?? []) {
        steps.push({
          type: "tool_result",
          toolName: tr.toolName,
          content:
            typeof tr.result === "string"
              ? tr.result
              : JSON.stringify(tr.result),
        });
      }
    },
  });

  return { text: result.text, steps };
}
