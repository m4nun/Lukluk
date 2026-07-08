import { z } from "zod";
import { safeTool } from "./safe-tool";
import type { PlanningRepository } from "./repository";
import { findPetPlaces } from "./map-places";

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

function createPetPlacesTool() {
  return safeTool(
    async ({ query, location }) => {
      try {
        const result = await findPetPlaces(location);
        if (!result) {
          // Nominatim has zero fuzzy matching — even one character off
          // returns nothing. Tell the LLM to stop and ask for correction
          // rather than firing more tools (web_search will just waste
          // time searching for a misspelled place name).
          return `NO LOCATION FOUND: "${location}" is not a recognized place in Thailand. STOP — do NOT call web_search or any other tool. Reply DIRECTLY: "ขอโทษครับ ฉันไม่พบ '${location}' บนแผนที่ — คุณสะกดถูกไหมครับ? หรือกำลังหมายถึง Phitsanulok (พิษณุโลก) หรือที่อื่นในไทยครับ?" Wait for the user to correct the spelling, then retry with the corrected name.`;
        }

        // Always return the JSON so the client renders the map (center pin +
        // scrollable list) even when zero places are found. This proves the map
        // is working; the user can drag/zoom the area or try a broader search.
        return JSON.stringify(result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return `SEARCH FAILED (transient): ${msg}. The map service is temporarily unavailable. Do NOT tell the user the system is broken — it is a transient issue. Call web_search to find pet places as a fallback, and mention that the map will be back.`;
      }
    },
    {
      name: "search_pet_places",
      description: `Show an interactive map of nearby pet places in Thailand. CALL THIS TOOL whenever the user asks about pet shops, vets, grooming, boarding, dog parks, or anything location-based ("pet shop near me", "vet in Bangkok", "where can I buy a hamster nearby"). Pass a location extracted from the user's message (city, district, or area in Thailand). If no location is given, ask the user for their area first. Results render as a clickable map inline in the chat. Categories searched: pet shops, vets, boarding, dog parks, grooming.`,
      schema: z.object({
        query: z.string().describe("What the user is looking for, e.g., 'pet shop', 'vet', 'dog park'"),
        location: z.string().describe("Location in Thailand as a place name, e.g., 'Bangkok', 'Sukhumvit, Bangkok', 'Chiang Mai'"),
      }),
    }
  );
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
      description: `Search the web for current prices, products, or real-world info. Use ONLY when you need up-to-date data. Do NOT call for general advice.`,
      schema: z.object({
        query: z.string().describe("Search query, e.g., 'Golden Retriever price Thailand 2026'"),
      }),
    }
  );
}

export function createAgentTools(repo: PlanningRepository) {
  const webSearchTool = createWebSearchTool();
  const petPlacesTool = createPetPlacesTool();

  const updateExpenseTool = safeTool(
    async ({ planning_profile_id, expenses }) => {
      await repo.replaceExpenses(planning_profile_id, expenses);
      const summary = expenses.map((e) => `${e.item}: ${e.amount_thb} THB`).join(", ");
      return `SUCCESS: Updated ${expenses.length} expense items. ${summary}`;
    },
    {
      name: "update_expenses",
      description: `Update the expense table. REPLACES all existing expenses. Categories: initial, monthly, annual, one_time.`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        expenses: z.array(z.object({
          category: z.enum(["initial", "monthly", "annual", "one_time"]),
          item: z.string().describe("Expense name"),
          amount_thb: z.number().int().min(0).describe("Amount in THB"),
          note: z.string().optional().nullable(),
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
      description: `Update the concern checklist. REPLACES all existing concerns. Statuses: unresolved, resolved, not_applicable.`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        concerns: z.array(z.object({
          concern_id: z.string().describe("Unique ID like 'shedding'"),
          title: z.string().describe("Short title"),
          status: z.enum(["unresolved", "resolved", "not_applicable"]),
          note: z.string().optional().nullable(),
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
      description: `Update decision status. Call only when user explicitly states their decision. Statuses: exploring, considering, ready_to_buy, not_a_fit, already_have.`,
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
      description: `Get current planning data. Usually NOT needed - context is pre-injected.`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
      }),
    }
  );

  return [webSearchTool, petPlacesTool, updateExpenseTool, updateConcernsTool, updateDecisionStatusTool, getContextTool];
}

export function createCareTools(repo: PlanningRepository) {
  const webSearchTool = createWebSearchTool();
  const petPlacesTool = createPetPlacesTool();

  const getCareContextTool = safeTool(
    async ({ owned_profile_id }) => {
      try {
        const owned = await repo.getOwnedProfile(owned_profile_id);
        if (!owned) return "ERROR: Owned pet profile not found.";

        const [expenses, foodGuide, schedule, healthMetrics] = await Promise.all([
          repo.getActualExpenses(owned_profile_id),
          repo.getFoodGuide(owned_profile_id),
          repo.getSchedule(owned_profile_id),
          repo.getHealthMetrics(owned_profile_id),
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
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("get_care_context error:", msg);
        return `ERROR loading care context: ${msg}`;
      }
    },
    {
      name: "get_care_context",
      description: `Get current care data. Usually NOT needed - context is pre-injected.`,
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
      description: `Update expense tracker. REPLACES all existing. Categories: food, medical, grooming, supplies, other.`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        expenses: z.array(z.object({
          category: z.enum(["food", "medical", "grooming", "supplies", "other"]),
          item: z.string().describe("Expense name"),
          amount_thb: z.number().int().min(0).describe("Amount in THB"),
          note: z.string().optional().nullable(),
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
      description: `Update food guide. REPLACES all existing cards. Use web_search first for real products.`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        cards: z.array(z.object({
          id: z.string().describe("Unique ID"),
          name: z.string().describe("Meal name"),
          brand: z.string().describe("Brand and product"),
          amount: z.string().describe("Amount"),
          frequency: z.string().describe("When to feed"),
          image: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
        })),
      }),
    }
  );

  const updateScheduleTool = safeTool(
    async ({ owned_profile_id, schedule }) => {
      try {
        await repo.replaceSchedule(owned_profile_id, schedule);
        const summary = schedule.map((s) => `${s.title} (${s.event_type}, ${s.date})`).join(", ");
        return `SUCCESS: Updated ${schedule.length} schedule events. ${summary}`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("update_schedule error:", msg);
        return `ERROR updating schedule: ${msg}`;
      }
    },
    {
      name: "update_schedule",
      description: `Update schedule. REPLACES all events. Types: vaccine, checkup, grooming, medication, boarding, emergency, other.`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        schedule: z.array(z.object({
          id: z.string().describe("Unique ID"),
          title: z.string().describe("Event title"),
          event_type: z.enum(["vaccine", "checkup", "grooming", "medication", "boarding", "emergency", "other"]),
          date: z.string().describe("YYYY-MM-DD"),
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
      try {
        const metric = {
          id: `health-${Date.now()}`,
          metric_type,
          value,
          unit,
          recorded_date,
          notes: notes || undefined,
        };
        await repo.addHealthMetric(owned_profile_id, metric);
        return `SUCCESS: Logged ${metric_type} measurement: ${value} ${unit} on ${recorded_date}.`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("add_health_metric error:", msg);
        return `ERROR logging health metric: ${msg}`;
      }
    },
    {
      name: "add_health_metric",
      description: `Log a health measurement (weight). Include value, unit, and date.`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        metric_type: z.enum(["weight"]),
        value: z.number().describe("Measurement value"),
        unit: z.string().describe("Unit like 'kg', 'lbs'"),
        recorded_date: z.string().describe("YYYY-MM-DD"),
        notes: z.string().optional().nullable(),
      }),
    }
  );

  return [webSearchTool, petPlacesTool, getCareContextTool, updateActualExpensesTool, updateFoodGuideTool, updateScheduleTool, addHealthMetricTool];
}
