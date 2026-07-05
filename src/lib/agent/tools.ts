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
      description: "Update the Estimated Expense Table for a Planning Pet Profile. Overwrites all existing expenses with the new list.",
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        expenses: z.array(z.object({
          category: z.enum(["initial", "monthly", "annual", "one_time"]),
          item: z.string(),
          amount_thb: z.number().int().min(0),
          note: z.string().optional(),
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
      description: "Update the Concern Checklist for a Planning Pet Profile. Overwrites all existing concerns with the new list.",
      schema: z.object({
        planning_profile_id: z.string().uuid(),
        concerns: z.array(z.object({
          concern_id: z.string(),
          title: z.string(),
          status: z.enum(["unresolved", "resolved", "not_applicable"]),
          note: z.string().optional(),
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
      description: "Change the decision status for a Planning Pet Profile.",
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
      description: "Get the full context for a Planning Pet Profile — pet type info, expenses, concerns, and owner experiences.",
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

      const [expenses, schedule, food] = await Promise.all([
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
        food_guide: food,
      });
    },
    {
      name: "get_care_context",
      description: "Get the full context for an Owned Pet Profile — pet details, expenses, activity schedule, and food guide.",
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
      description: "Update the Actual Expense Tracker for an Owned Pet Profile.",
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

  const updateActivityScheduleTool = safeTool(
    async ({ owned_profile_id, schedule }) => {
      await repo.replaceActivitySchedule(owned_profile_id, schedule);
      return `Updated activity schedule with ${schedule.length} entries.`;
    },
    {
      name: "update_activity_schedule",
      description: "Update the daily Activity Schedule for an Owned Pet Profile.",
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        schedule: z.array(z.object({
          day: z.string(),
          activity: z.string(),
          time: z.string(),
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
      description: "Update the Food Guide for an Owned Pet Profile.",
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        guide: z.object({
          brand: z.string().optional(),
          amount: z.string().optional(),
          frequency: z.string().optional(),
          notes: z.string().optional(),
        }),
      }),
    }
  );

  return [getCareContextTool, updateActualExpensesTool, updateActivityScheduleTool, updateFoodGuideTool];
}
