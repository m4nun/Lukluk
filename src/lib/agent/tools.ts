import { z } from "zod";
import { safeTool } from "./safe-tool";
import type { PlanningRepository } from "./repository";

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
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

function createWebSearchTool() {
  return safeTool(
    async ({ query }) => {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) return "ERROR: Web search not configured. Set TAVILY_API_KEY.";

      try {
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

        if (!data.results?.length) return "NO RESULTS: No relevant information found. Try a different query.";

        const results = data.results
          .slice(0, 5)
          .map((r: { title: string; url: string; content: string }) =>
            `[${r.title}]\n${r.content}\nSource: ${r.url}`
          )
          .join("\n\n");

        return `SEARCH RESULTS:\n${results}`;
      } catch (e) {
        return `SEARCH FAILED: ${e instanceof Error ? e.message : "Unknown error"}. Use your existing knowledge instead.`;
      }
    },
    {
      name: "web_search",
      description: `WHEN TO CALL: User asks about current prices, availability, specific brands, recent news, or any question requiring up-to-date real-world information.

WHAT IT DOES: Searches the web and returns structured results with titles, summaries, and source URLs.

TRIGGERS: "how much does X cost", "what brands", "is X available", "recent news about", "what's the best"

DO NOT CALL: For general pet care advice you already know, or when updating existing data without needing new information.`,
      schema: z.object({
        query: z.string().describe("Specific search query. Include location if relevant (e.g., 'Golden Retriever price Thailand 2026')"),
      }),
    }
  );
}

export function createAgentTools(repo: PlanningRepository) {
  const webSearchTool = createWebSearchTool();

  const updateExpenseTool = safeTool(
    async ({ planning_profile_id, expenses }) => {
      await repo.replaceExpenses(planning_profile_id, expenses);
      const summary = expenses.map((e) => `${e.item}: ${e.amount_thb} THB`).join(", ");
      return `SUCCESS: Updated ${expenses.length} expense items. ${summary}`;
    },
    {
      name: "update_expenses",
      description: `WHEN TO CALL: User discusses pet costs, expenses, budget, or wants price estimates. Call AFTER web_search if you need current prices.

WHAT IT DOES: Replaces the expense table with new items. Each item needs: category, item name, amount in THB, optional note.

CATEGORIES: "initial" (one-time purchase), "monthly" (recurring), "annual" (yearly), "one_time" (occasional)

TRIGGERS: "how much does X cost", "what's the monthly expense", "create a budget", "estimate expenses"

IMPORTANT: This REPLACES all existing expenses. Include ALL items, not just new ones.`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        expenses: z.array(z.object({
          category: z.enum(["initial", "monthly", "annual", "one_time"]),
          item: z.string().describe("Expense name, e.g., 'Food (Royal Canin)'"),
          amount_thb: z.number().int().min(0).describe("Amount in Thai Baht"),
          note: z.string().optional().nullable().describe("Additional details"),
        })),
      }),
    }
  );

  const updateConcernsTool = safeTool(
    async ({ planning_profile_id, concerns }) => {
      await repo.replaceConcerns(planning_profile_id, concerns);
      const summary = concerns.map((c) => `${c.title} (${c.status})`).join(", ");
      return `SUCCESS: Updated ${concerns.length} concerns. ${summary}`;
    },
    {
      name: "update_concerns",
      description: `WHEN TO CALL: User asks about concerns, risks, downsides, or worries about pet ownership. Call AFTER web_search if you need current information.

WHAT IT DOES: Replaces the concern checklist. Each concern needs: unique ID, title, status, optional note.

STATUSES: "unresolved" (needs attention), "resolved" (addressed), "not_applicable" (doesn't apply)

TRIGGERS: "what are the concerns", "what are the risks", "what should I worry about", "downsides of"

IMPORTANT: This REPLACES all existing concerns. Include ALL concerns, not just new ones.`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        concerns: z.array(z.object({
          concern_id: z.string().describe("Unique ID like 'shedding', 'allergies', 'cost'"),
          title: z.string().describe("Short title like 'Heavy shedding'"),
          status: z.enum(["unresolved", "resolved", "not_applicable"]),
          note: z.string().optional().nullable().describe("Details or mitigation tips"),
        })),
      }),
    }
  );

  const updateDecisionStatusTool = safeTool(
    async ({ planning_profile_id, status }) => {
      await repo.updateDecisionStatus(planning_profile_id, status);
      return `SUCCESS: Decision status updated to "${status}"`;
    },
    {
      name: "update_decision_status",
      description: `WHEN TO CALL: User explicitly states they're ready to buy, not interested, or still exploring.

WHAT IT DOES: Updates the decision status to reflect the user's choice.

STATUSES: "exploring" (just looking), "considering" (thinking about it), "ready_to_buy" (decided), "not_a_fit" (not for me), "already_have" (already own one)

TRIGGERS: "I'm ready to buy", "I want to get one", "not for me", "I'll pass", "still thinking"

DO NOT CALL: Unless the user explicitly states their decision.`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        status: z.enum(["exploring", "considering", "ready_to_buy", "not_a_fit", "already_have"]),
      }),
    }
  );

  const getContextTool = safeTool(
    async ({ planning_profile_id }) => {
      const planning = await repo.getProfile(planning_profile_id);
      if (!planning) return "ERROR: Planning profile not found.";

      const [expenses, concerns, experiences] = await Promise.all([
        repo.getExpenses(planning_profile_id),
        repo.getConcerns(planning_profile_id),
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
    {
      name: "get_context",
      description: `WHEN TO CALL: You need to understand the current state before making updates. Usually NOT needed because context is pre-injected.

WHAT IT DOES: Returns full context including pet info, expenses, concerns, and owner experiences.

TRIGGERS: Rarely needed. Context is usually pre-injected into the conversation.`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
      }),
    }
  );

  return [webSearchTool, updateExpenseTool, updateConcernsTool, updateDecisionStatusTool, getContextTool];
}

export function createCareTools(repo: PlanningRepository) {
  const webSearchTool = createWebSearchTool();

  const getCareContextTool = safeTool(
    async ({ owned_profile_id }) => {
      const owned = await repo.getOwnedProfile(owned_profile_id);
      if (!owned) return "ERROR: Owned pet profile not found.";

      const [expenses, schedule, foodGuide] = await Promise.all([
        repo.getActualExpenses(owned_profile_id),
        repo.getActivitySchedule(owned_profile_id),
        repo.getFoodGuide(owned_profile_id),
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
        activity_schedule: schedule,
        food_guide: foodGuide,
      });
    },
    {
      name: "get_care_context",
      description: `WHEN TO CALL: You need to understand the current state before making updates. Usually NOT needed because context is pre-injected.

WHAT IT DOES: Returns full context including pet details, expenses, activities, and food guide.

TRIGGERS: Rarely needed. Context is usually pre-injected into the conversation.`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
      }),
    }
  );

  const updateActualExpensesTool = safeTool(
    async ({ owned_profile_id, expenses }) => {
      await repo.replaceActualExpenses(owned_profile_id, expenses);
      const summary = expenses.map((e) => `${e.item}: ${e.amount_thb} THB`).join(", ");
      return `SUCCESS: Updated ${expenses.length} expense items. ${summary}`;
    },
    {
      name: "update_actual_expenses",
      description: `WHEN TO CALL: User wants to track or update actual expenses for their pet. Call AFTER web_search if you need current prices.

WHAT IT DOES: Replaces the expense tracker with new items. Each item needs: category, item name, amount in THB, optional note.

CATEGORIES: "food", "medical", "grooming", "supplies", "other"

TRIGGERS: "track my expenses", "how much am I spending", "update my budget", "monthly costs"

IMPORTANT: This REPLACES all existing expenses. Include ALL items, not just new ones.`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        expenses: z.array(z.object({
          category: z.enum(["food", "medical", "grooming", "supplies", "other"]),
          item: z.string().describe("Expense name, e.g., 'Cat food (Royal Canin)'"),
          amount_thb: z.number().int().min(0).describe("Amount in Thai Baht"),
          note: z.string().optional().nullable().describe("Additional details"),
        })),
      }),
    }
  );

  const updateActivityScheduleTool = safeTool(
    async ({ owned_profile_id, activities }) => {
      await repo.replaceActivitySchedule(owned_profile_id, activities);
      const summary = activities.map((a) => `${a.name} (${a.difficulty})`).join(", ");
      return `SUCCESS: Updated ${activities.length} activities. ${summary}`;
    },
    {
      name: "update_activity_schedule",
      description: `WHEN TO CALL: User wants to add, remove, or change activities for their pet. Call AFTER web_search to find suitable activities.

WHAT IT DOES: Replaces the activity list. Each activity needs: unique ID, name, icon, difficulty, duration, frequency, optional image and notes.

DIFFICULTIES: "easy" (beginner), "medium" (moderate), "hard" (advanced)

TRIGGERS: "recommend activities", "what can I do with my pet", "exercise ideas", "activities for"

IMPORTANT: This REPLACES all existing activities. Include ALL activities, not just new ones. Use web_search first to find real activities with images.`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        activities: z.array(z.object({
          id: z.string().describe("Unique ID like 'hiking-1', 'fetch-daily'"),
          name: z.string().describe("Activity name like 'Hiking'"),
          icon: z.string().describe("Emoji or icon name like 'mountain', 'ball', 'paw'"),
          image: z.string().optional().nullable().describe("URL to activity image from web search"),
          difficulty: z.enum(["easy", "medium", "hard"]),
          duration: z.string().describe("Duration like '1-2 hours', '30 minutes'"),
          frequency: z.string().describe("Frequency like '2x/week', 'daily'"),
          notes: z.string().optional().nullable().describe("Tips or instructions"),
        })),
      }),
    }
  );

  const updateFoodGuideTool = safeTool(
    async ({ owned_profile_id, cards }) => {
      await repo.replaceFoodGuide(owned_profile_id, cards);
      const summary = cards.map((c) => `${c.name}: ${c.brand} (${c.amount})`).join(", ");
      return `SUCCESS: Updated ${cards.length} food cards. ${summary}`;
    },
    {
      name: "update_food_guide",
      description: `WHEN TO CALL: User asks about feeding, food, diet, or feeding schedule. Call AFTER web_search to find specific brands and products.

WHAT IT DOES: Replaces the food guide. Each card needs: unique ID, meal name, brand, amount, frequency, optional image and notes.

TRIGGERS: "what should I feed my pet", "food recommendations", "feeding schedule", "best food brands"

IMPORTANT: This REPLACES all existing food cards. Include ALL cards, not just new ones. Use web_search first to find real products with images.`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        cards: z.array(z.object({
          id: z.string().describe("Unique ID like 'breakfast-1', 'dinner-2'"),
          name: z.string().describe("Meal name like 'Breakfast', 'Dinner', 'Snack'"),
          brand: z.string().describe("Brand and product like 'Royal Canin Indoor'"),
          amount: z.string().describe("Amount like '40g', '1 can', '1 cup'"),
          frequency: z.string().describe("When to feed like 'Daily at 7am', '2x daily'"),
          image: z.string().optional().nullable().describe("URL to product image from web search"),
          notes: z.string().optional().nullable().describe("Preparation tips or notes"),
        })),
      }),
    }
  );

  return [webSearchTool, getCareContextTool, updateActualExpensesTool, updateActivityScheduleTool, updateFoodGuideTool];
}
