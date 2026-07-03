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
