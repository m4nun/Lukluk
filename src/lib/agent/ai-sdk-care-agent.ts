/**
 * AI SDK v7 Care Agent — ownership-mode pet care assistant.
 * Uses the same ToolLoopAgent pattern as the Decision Agent.
 */

import { tool, ToolLoopAgent, isStepCount, type ToolSet } from "ai";
import { z } from "zod";
import type { PlanningRepository } from "./repository";
import { getModel } from "./ai-sdk-provider";
import { CARE_SYSTEM_PROMPT } from "./graph";

async function fetchCareContext(
  repo: PlanningRepository,
  profileId: string,
): Promise<string> {
  try {
    const owned = await repo.getOwnedProfile(profileId);
    if (!owned) return "";

    const [expenses, foodGuide, schedule, healthMetrics] = await Promise.all(
      [
        repo.getActualExpenses(profileId),
        repo.getFoodGuide(profileId),
        repo.getSchedule(profileId),
        repo.getHealthMetrics(profileId),
      ],
    );

    return [
      "",
      "--- CURRENT STATE (auto-loaded, DO NOT ask user for IDs) ---",
      `Pet: ${owned.pet_name} (${owned.pet_type.name}, ${owned.age_life_stage})`,
      `Expenses (${expenses.length} items): ${JSON.stringify(expenses)}`,
      `Food guide: ${JSON.stringify(foodGuide)}`,
      `Schedule (${schedule.length} events): ${JSON.stringify(schedule)}`,
      `Health metrics (${healthMetrics.length} records): ${JSON.stringify(healthMetrics)}`,
      "--- END STATE ---",
    ].join("\n");
  } catch {
    return "";
  }
}

function createCareAISdkTools(
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
        const data = await response.json();

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

    update_actual_expenses: tool({
      description:
        "Update expense tracker. REPLACES all existing. Categories: food, medical, grooming, supplies, other.",
      inputSchema: z.object({
        expenses: z.array(
          z.object({
            category: z.enum([
              "food",
              "medical",
              "grooming",
              "supplies",
              "other",
            ]),
            item: z.string().describe("Expense name"),
            amount_thb: z.number().int().min(0).describe("Amount in THB"),
            note: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ expenses }) => {
        await repo.replaceActualExpenses(profileId, expenses);
        const summary = expenses
          .map((e) => `${e.item}: ${e.amount_thb} THB`)
          .join(", ");
        return `SUCCESS: Updated ${expenses.length} expense items. ${summary}`;
      },
    }),

    update_food_guide: tool({
      description:
        "Update food guide. REPLACES all existing cards. Use web_search first for real products.",
      inputSchema: z.object({
        cards: z.array(
          z.object({
            id: z.string().describe("Unique ID"),
            name: z.string().describe("Meal name"),
            brand: z.string().describe("Brand and product"),
            amount: z.string().describe("Amount"),
            frequency: z.string().describe("When to feed"),
            image: z.string().optional(),
            notes: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ cards }) => {
        await repo.replaceFoodGuide(profileId, cards);
        const summary = cards
          .map((c) => `${c.name}: ${c.brand} (${c.amount})`)
          .join(", ");
        return `SUCCESS: Updated ${cards.length} food cards. ${summary}`;
      },
    }),

    update_schedule: tool({
      description:
        "Update schedule. REPLACES all events. Types: vaccine, checkup, grooming, medication, boarding, emergency, other.",
      inputSchema: z.object({
        schedule: z.array(
          z.object({
            id: z.string().describe("Unique ID"),
            title: z.string().describe("Event title"),
            event_type: z.enum([
              "vaccine",
              "checkup",
              "grooming",
              "medication",
              "boarding",
              "emergency",
              "other",
            ]),
            date: z.string().describe("YYYY-MM-DD"),
            completed_date: z.string().optional(),
            recurring: z.boolean().optional(),
            recurrence_days: z.number().int().optional(),
            notes: z.string().optional(),
          }),
        ),
      }),
      execute: async ({ schedule }) => {
        await repo.replaceSchedule(profileId, schedule);
        const summary = schedule
          .map((s) => `${s.title} (${s.event_type}, ${s.date})`)
          .join(", ");
        return `SUCCESS: Updated ${schedule.length} schedule events. ${summary}`;
      },
    }),

    add_health_metric: tool({
      description:
        "Log a health measurement (weight). Include value, unit, and date.",
      inputSchema: z.object({
        metric_type: z.enum(["weight"]),
        value: z.number().describe("Measurement value"),
        unit: z.string().describe("Unit like 'kg', 'lbs'"),
        recorded_date: z.string().describe("YYYY-MM-DD"),
        notes: z.string().optional(),
      }),
      execute: async ({
        metric_type,
        value,
        unit,
        recorded_date,
        notes,
      }) => {
        const metric = {
          id: `health-${Date.now()}`,
          metric_type,
          value,
          unit,
          recorded_date,
          notes: notes || undefined,
        };
        await repo.addHealthMetric(profileId, metric);
        return `SUCCESS: Logged ${metric_type} measurement: ${value} ${unit} on ${recorded_date}.`;
      },
    }),

    get_care_context: tool({
      description:
        "Get current care data. Usually NOT needed - context is pre-injected.",
      inputSchema: z.object({}),
      execute: async () => {
        const owned = await repo.getOwnedProfile(profileId);
        if (!owned) return "ERROR: Owned pet profile not found.";

        const [expenses, foodGuide, schedule, healthMetrics] =
          await Promise.all([
            repo.getActualExpenses(profileId),
            repo.getFoodGuide(profileId),
            repo.getSchedule(profileId),
            repo.getHealthMetrics(profileId),
          ]);

        return JSON.stringify({
          owned_profile: {
            id: owned.id,
            pet_name: owned.pet_name,
            age_life_stage: owned.age_life_stage,
            got_date: owned.got_date,
            pet_type: owned.pet_type,
          },
          actual_expenses: expenses,
          food_guide: foodGuide,
          schedule,
          health_metrics: healthMetrics,
        });
      },
    }),
  };
}

export async function runAiSdkCareAgent(
  repo: PlanningRepository,
  profileId: string,
  userMessage: string,
  previousMessages: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [],
): Promise<{
  text: string;
  steps: Array<{
    type: "tool_call" | "tool_result";
    toolName: string;
    content: string;
  }>;
}> {
  const context = await fetchCareContext(repo, profileId);
  const enrichedMessage = userMessage + context;

  const agent = new ToolLoopAgent({
    model: getModel(),
    instructions: CARE_SYSTEM_PROMPT,
    tools: createCareAISdkTools(repo, profileId),
    stopWhen: isStepCount(6),
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

  const steps: Array<{
    type: "tool_call" | "tool_result";
    toolName: string;
    content: string;
  }> = [];

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
