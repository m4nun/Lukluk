import { z } from "zod";
import { safeTool } from "./safe-tool";
import type { PlanningRepository } from "./repository";

export function createCareTools(repo: PlanningRepository) {
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

  const updateActivityScheduleTool = safeTool(
    async ({ owned_profile_id, activities }) => {
      await repo.replaceActivitySchedule(owned_profile_id, activities);
      return `Updated activity interests with ${activities.length} activities.`;
    },
    {
      name: "update_activity_schedule",
      description: "Update the activity interests for an owned pet.",
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
    async ({ owned_profile_id, food_guide }) => {
      await repo.replaceFoodGuide(owned_profile_id, food_guide);
      return `Food guide updated.`;
    },
    {
      name: "update_food_guide",
      description: "Update the food guide for an owned pet.",
      schema: z.object({
        owned_profile_id: z.string().uuid(),
        food_guide: z.object({
          brand: z.string().optional(),
          amount: z.string().optional(),
          frequency: z.string().optional(),
          notes: z.string().optional(),
        }),
      }),
    }
  );

  const getCareContextTool = safeTool(
    async ({ owned_profile_id }) => {
      const owned = await repo.getOwnedProfile(owned_profile_id);
      if (!owned) return "Owned profile not found.";

      const [expenses, schedule, foodGuide] = await Promise.all([
        repo.getActualExpenses(owned_profile_id),
        repo.getActivitySchedule(owned_profile_id),
        repo.getFoodGuide(owned_profile_id),
      ]);

      return JSON.stringify({ owned, expenses, schedule, foodGuide });
    },
    {
      name: "get_care_context",
      description: "Get the full care context — owned pet details, actual expenses, activity schedule, and food guide.",
      schema: z.object({
        owned_profile_id: z.string().uuid(),
      }),
    }
  );

  return [updateActualExpensesTool, updateActivityScheduleTool, updateFoodGuideTool, getCareContextTool];
}
