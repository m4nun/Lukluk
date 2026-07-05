import { z } from "zod";
import { safeTool } from "./safe-tool";
import type { PlanningRepository } from "./repository";
import type { ScheduleCard, HealthMetric } from "@/lib/types";

export function createCareTools(repo: PlanningRepository) {
  const webSearchTool = safeTool(
    async ({ query }) => {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) return "Web search not configured.";

      try {
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
        const data = await response.json();
        if (!data.results?.length) return "No results found.";

        return data.results
          .slice(0, 5)
          .map((r: { title: string; url: string; content: string }) =>
            `**${r.title}**\n${r.content}\nSource: ${r.url}`
          )
          .join("\n\n");
      } catch {
        return "Search failed. Please try again.";
      }
    },
    {
      name: "web_search",
      description: "Search the web for current information. Use when user asks about current prices, availability, recent news, or any question needing up-to-date information.",
      schema: z.object({
        query: z.string().describe("The search query"),
      }),
    }
  );

  const updateActualExpensesTool = safeTool(
    async ({ owned_profile_id, expenses }) => {
      await repo.replaceActualExpenses(owned_profile_id, expenses);
      return `Updated ${expenses.length} expense items.`;
    },
    {
      name: "update_actual_expenses",
      description: "Update the actual expense tracker for an owned pet.",
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        expenses: z.array(z.object({
          category: z.enum(["food", "medical", "grooming", "supplies", "other"]),
          item: z.string(),
          amount_thb: z.number().int().min(0),
          note: z.string().optional(),
        })),
      }),
    }
  );

  const updateFoodGuideTool = safeTool(
    async ({ owned_profile_id, cards }) => {
      await repo.replaceFoodGuide(owned_profile_id, cards);
      return `Updated food guide with ${cards.length} food cards.`;
    },
    {
      name: "update_food_guide",
      description: "Update the food guide for an owned pet. Call this when user asks about feeding, food, diet, what to feed, or feeding schedule. The cards array replaces all existing food cards. Each card must have: id (unique string), name (string like \"Breakfast\"), brand (string like \"Royal Canin\"), amount (string like \"40g\"), frequency (string like \"Daily at 7am\"), image (optional URL), and optional notes (string).",
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        cards: z.array(z.object({
          id: z.string(),
          name: z.string(),
          brand: z.string(),
          amount: z.string(),
          frequency: z.string(),
          image: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
        })),
      }),
    }
  );

  const getCareContextTool = safeTool(
    async ({ owned_profile_id }) => {
      const owned = await repo.getOwnedProfile(owned_profile_id);
      if (!owned) return "Owned profile not found.";

      const [expenses, foodGuide, schedule, healthMetrics] = await Promise.all([
        repo.getActualExpenses(owned_profile_id),
        repo.getFoodGuide(owned_profile_id),
        repo.getSchedule(owned_profile_id),
        repo.getHealthMetrics(owned_profile_id),
      ]);

      return JSON.stringify({ owned, expenses, foodGuide, schedule, healthMetrics });
    },
    {
      name: "get_care_context",
      description: "Get the full care context — owned pet details, actual expenses, food guide, schedule (vaccine/checkup/grooming dates), and health metrics (weight history).",
      schema: z.object({
        owned_profile_id: z.string().uuid(),
      }),
    }
  );

  const updateScheduleTool = safeTool(
    async ({ owned_profile_id, schedule }) => {
      await repo.replaceSchedule(owned_profile_id, schedule);
      return `Updated schedule with ${schedule.length} events.`;
    },
    {
      name: "update_schedule",
      description: `WHEN TO CALL: User asks to schedule a vet visit, vaccine, grooming, checkup, or any appointment. Also call when user wants to add, remove, or change schedule items.

The schedule array replaces all existing entries. Each item must have:
- id: unique string (e.g. "sched-1")
- title: string (e.g. "Annual vaccination")
- event_type: one of "vaccine", "checkup", "grooming", "medication", "boarding", "emergency", "other"
- date: string in YYYY-MM-DD format
- recurring: boolean (optional, default false)
- recurrence_days: number (optional, days between recurrences)
- notes: string (optional)

TRIGGERS: "schedule vet visit", "book grooming", "when is the next checkup", "remind me to vaccinate", "add appointment"`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        schedule: z.array(z.object({
          id: z.string(),
          title: z.string(),
          event_type: z.enum(["vaccine", "checkup", "grooming", "medication", "boarding", "emergency", "other"]),
          date: z.string(),
          completed_date: z.string().optional().nullable(),
          recurring: z.boolean().optional(),
          recurrence_days: z.number().int().optional().nullable(),
          notes: z.string().optional().nullable(),
        })),
      }),
    }
  );

  const addHealthMetricTool = safeTool(
    async ({ owned_profile_id, metric_type, value, unit, recorded_date, notes }) => {
      const metric: HealthMetric = {
        id: `health-${Date.now()}`,
        metric_type: metric_type as "weight",
        value,
        unit,
        recorded_date,
        notes: notes || undefined,
      };
      await repo.addHealthMetric(owned_profile_id, metric);
      return `Added ${metric_type} measurement: ${value} ${unit} on ${recorded_date}.`;
    },
    {
      name: "add_health_metric",
      description: `WHEN TO CALL: User wants to log a health measurement like weight. Currently supports weight tracking.

TRIGGERS: "log weight", "record weight", "my pet weighs", "update weight", "add weight measurement"`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        metric_type: z.enum(["weight"]),
        value: z.number(),
        unit: z.string(),
        recorded_date: z.string(),
        notes: z.string().optional().nullable(),
      }),
    }
  );

  return [webSearchTool, updateActualExpensesTool, updateFoodGuideTool, updateScheduleTool, addHealthMetricTool, getCareContextTool];
}
