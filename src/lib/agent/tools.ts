import { z } from "zod";
import { safeTool } from "./safe-tool";
import type { PlanningRepository } from "./repository";

export function createAgentTools(repo: PlanningRepository) {
  const updateExpenseTool = safeTool(
    async ({ planning_profile_id, expenses }) => {
      await repo.replaceExpenses(planning_profile_id, expenses);
      return `Updated ${expenses.length} expense items.`;
    },
    {
      name: "update_expenses",
      description: `Update the estimated expense table for a planning pet. Call this when user asks about costs, expenses, budget, or how much a pet costs. The expenses array replaces all existing expenses. Each item must have: category ("initial"|"monthly"|"annual"|"one_time"), item (string), amount_thb (number), and optional note (string or null). Example: [{category:"monthly", item:"Food", amount_thb:1500, note:"Premium brand"}]`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        expenses: z.array(z.object({
          category: z.enum(["initial", "monthly", "annual", "one_time"]),
          item: z.string(),
          amount_thb: z.number().int().min(0),
          note: z.string().optional().nullable(),
        })),
      }),
    }
  );

  const updateConcernsTool = safeTool(
    async ({ planning_profile_id, concerns }) => {
      await repo.replaceConcerns(planning_profile_id, concerns);
      return `Updated ${concerns.length} concern items.`;
    },
    {
      name: "update_concerns",
      description: `Update the concern checklist for a planning pet. Call this when user asks about concerns, risks, downsides, or worries. Each item must have: concern_id (string like "heavy_shedding"), title (string), status ("unresolved"|"resolved"|"not_applicable"), and optional note. Example: [{concern_id:"allergies", title:"Heavy shedding", status:"unresolved", note:"Requires daily brushing"}]`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        concerns: z.array(z.object({
          concern_id: z.string(),
          title: z.string(),
          status: z.enum(["unresolved", "resolved", "not_applicable"]),
          note: z.string().optional().nullable(),
        })),
      }),
    }
  );

  const updateDecisionStatusTool = safeTool(
    async ({ planning_profile_id, status }) => {
      await repo.updateDecisionStatus(planning_profile_id, status);
      return `Decision status updated to: ${status}`;
    },
    {
      name: "update_decision_status",
      description: `Change the decision status for a planning pet. Call this when user says they're ready to buy, not interested, or still exploring. Status must be one of: "exploring", "considering", "ready_to_buy", "not_a_fit", "already_have".`,
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        status: z.enum(["exploring", "considering", "ready_to_buy", "not_a_fit", "already_have"]),
      }),
    }
  );

  const getContextTool = safeTool(
    async ({ planning_profile_id }) => {
      const planning = await repo.getProfile(planning_profile_id);
      if (!planning) return "Planning profile not found.";

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
      description: "Get the full context for a planning pet. Call this FIRST before any other tool. Returns pet type info, current expenses, concerns, and owner experiences.",
      schema: z.object({
        planning_profile_id: z.string().uuid(),
      }),
    }
  );

  return [updateExpenseTool, updateConcernsTool, updateDecisionStatusTool, getContextTool];
}

export function createCareTools(repo: PlanningRepository) {
  const getCareContextTool = safeTool(
    async ({ owned_profile_id }) => {
      const owned = await repo.getOwnedProfile(owned_profile_id);
      if (!owned) return "Owned pet profile not found.";

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
      description: "Get the full care context for an owned pet. Call this FIRST before any other tool. Returns pet details, current expenses, activity schedule, and food guide.",
      schema: z.object({
        owned_profile_id: z.string().uuid(),
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
      description: `Update the actual expense tracker for an owned pet. Call this when user asks about costs, expenses, budget, or wants to track spending. The expenses array replaces all existing expenses. Each item must have: category ("food"|"medical"|"grooming"|"supplies"|"other"), item (string), amount_thb (number), and optional note (string or null). Example: [{category:"food", item:"Cat food (Royal Canin)", amount_thb:1200, note:"Monthly"}]`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        expenses: z.array(z.object({
          category: z.enum(["food", "medical", "grooming", "supplies", "other"]),
          item: z.string(),
          amount_thb: z.number().int().min(0),
          note: z.string().optional().nullable(),
        })),
      }),
    }
  );

  const updateActivityScheduleTool = safeTool(
    async ({ owned_profile_id, activities }) => {
      await repo.replaceActivitySchedule(owned_profile_id, activities);
      return `Updated activity interests with ${activities.length} activities.`;
    },
    {
      name: "update_activity_schedule",
      description: `Update the activity interests for an owned pet. Call this when user wants to add, remove, or change activities their pet enjoys. The activities array replaces all existing entries. Each item must have: name (string like "Hiking"), icon (string like "mountain"), difficulty ("easy"|"medium"|"hard"), duration (string like "1-2 hours"), frequency (string like "2x/week"), and optional notes (string). Example: [{name:"Hiking", icon:"mountain", difficulty:"medium", duration:"1-2 hours", frequency:"2x/week", notes:"Mountain trails preferred"}]`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        activities: z.array(z.object({
          name: z.string(),
          icon: z.string(),
          difficulty: z.enum(["easy", "medium", "hard"]),
          duration: z.string(),
          frequency: z.string(),
          notes: z.string().optional().nullable(),
        })),
      }),
    }
  );

  const updateFoodGuideTool = safeTool(
    async ({ owned_profile_id, guide }) => {
      await repo.replaceFoodGuide(owned_profile_id, guide);
      return "Food guide updated.";
    },
    {
      name: "update_food_guide",
      description: `Update the food guide for an owned pet. Call this when user asks about feeding, food, diet, what to feed, or feeding schedule. All fields are optional strings or null. Example: {brand:"Royal Canin Indoor", amount:"40g per meal", frequency:"2 times per day", notes:"No wet food - causes diarrhea"}`,
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        guide: z.object({
          brand: z.string().optional().nullable(),
          amount: z.string().optional().nullable(),
          frequency: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
        }),
      }),
    }
  );

  return [getCareContextTool, updateActualExpensesTool, updateActivityScheduleTool, updateFoodGuideTool];
}
