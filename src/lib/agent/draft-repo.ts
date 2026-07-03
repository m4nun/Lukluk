import type { PlanningRepository, PlanningProfileWithPetType, OwnedProfile, OwnerExperienceRow, ActivityEntry, FoodGuide } from "./repository";
import type { ExpenseItem, ConcernChecklistItem, DecisionStatus } from "@/lib/types";
import { SupabasePlanningRepository } from "./supabase-repo";
import type { DraftStore } from "./draft-store";

/**
 * Draft-wrapping repository. Agent tool calls write drafts instead of mutating directly.
 * Reads pass through to the real repository. Writes go to the injected DraftStore.
 */
export class DraftPlanningRepository implements PlanningRepository {
  constructor(
    private real: PlanningRepository,
    private drafts: DraftStore,
    private userId: string
  ) {}

  // ---- Planning reads (pass through) ----
  async getProfile(id: string) { return this.real.getProfile(id); }
  async getExpenses(pid: string) { return this.real.getExpenses(pid); }
  async getConcerns(pid: string) { return this.real.getConcerns(pid); }
  async getOwnerExperiences(ptid: string) { return this.real.getOwnerExperiences(ptid); }

  // ---- Planning writes → drafts ----
  async replaceExpenses(planningProfileId: string, expenses: ExpenseItem[]): Promise<void> {
    const current = await this.real.getExpenses(planningProfileId);
    await this.drafts.create({
      planning_pet_profile_id: planningProfileId,
      user_id: this.userId,
      target: "estimated_expenses",
      current_value: current,
      proposed_value: expenses,
    });
  }

  async replaceConcerns(planningProfileId: string, concerns: ConcernChecklistItem[]): Promise<void> {
    const current = await this.real.getConcerns(planningProfileId);
    await this.drafts.create({
      planning_pet_profile_id: planningProfileId,
      user_id: this.userId,
      target: "concern_checklist",
      current_value: current,
      proposed_value: concerns,
    });
  }

  async updateDecisionStatus(planningProfileId: string, status: DecisionStatus): Promise<void> {
    const profile = await this.real.getProfile(planningProfileId);
    await this.drafts.create({
      planning_pet_profile_id: planningProfileId,
      user_id: this.userId,
      target: "decision_status",
      current_value: profile?.decision_status ?? null,
      proposed_value: status,
    });
  }

  // ---- Care writes → drafts ----
  async replaceActualExpenses(ownedProfileId: string, expenses: ExpenseItem[]): Promise<void> {
    const current = await this.real.getActualExpenses(ownedProfileId);
    await this.drafts.create({
      planning_pet_profile_id: ownedProfileId,
      user_id: this.userId,
      target: "actual_expenses",
      current_value: current,
      proposed_value: expenses,
    });
  }

  async replaceActivitySchedule(ownedProfileId: string, schedule: ActivityEntry[]): Promise<void> {
    const current = await this.real.getActivitySchedule(ownedProfileId);
    await this.drafts.create({
      planning_pet_profile_id: ownedProfileId,
      user_id: this.userId,
      target: "activity_schedule",
      current_value: current,
      proposed_value: schedule,
    });
  }

  async replaceFoodGuide(ownedProfileId: string, guide: FoodGuide): Promise<void> {
    const current = await this.real.getFoodGuide(ownedProfileId);
    await this.drafts.create({
      planning_pet_profile_id: ownedProfileId,
      user_id: this.userId,
      target: "food_guide",
      current_value: current,
      proposed_value: guide,
    });
  }

  // ---- Care reads (pass through) ----
  async getOwnedProfile(id: string) { return this.real.getOwnedProfile(id); }
  async getActualExpenses(id: string) { return this.real.getActualExpenses(id); }
  async getActivitySchedule(id: string) { return this.real.getActivitySchedule(id); }
  async getFoodGuide(id: string) { return this.real.getFoodGuide(id); }
}

// ---- Draft lifecycle: confirm / reject / query ----

export async function getPendingDrafts(planningProfileId: string, drafts: DraftStore) {
  return drafts.getPending(planningProfileId);
}

export async function confirmDraft(draftId: string, drafts: DraftStore): Promise<void> {
  const draft = await drafts.confirm(draftId);
  if (!draft) throw new Error("Draft not found");

  const repo = new SupabasePlanningRepository();

  switch (draft.target) {
    case "estimated_expenses":
      await repo.replaceExpenses(draft.planning_pet_profile_id, draft.proposed_value as ExpenseItem[]);
      break;
    case "concern_checklist":
      await repo.replaceConcerns(draft.planning_pet_profile_id, draft.proposed_value as ConcernChecklistItem[]);
      break;
    case "decision_status":
      await repo.updateDecisionStatus(draft.planning_pet_profile_id, draft.proposed_value as DecisionStatus);
      break;
    case "actual_expenses":
      await repo.replaceActualExpenses(draft.planning_pet_profile_id, draft.proposed_value as ExpenseItem[]);
      break;
    case "activity_schedule":
      await repo.replaceActivitySchedule(draft.planning_pet_profile_id, draft.proposed_value as ActivityEntry[]);
      break;
    case "food_guide":
      await repo.replaceFoodGuide(draft.planning_pet_profile_id, draft.proposed_value as FoodGuide);
      break;
  }
}

export async function rejectDraft(draftId: string, drafts: DraftStore): Promise<void> {
  await drafts.reject(draftId);
}

export async function discardStaleDrafts(planningProfileId: string, target: string, drafts: DraftStore): Promise<void> {
  await drafts.discardStale(planningProfileId, target);
}
