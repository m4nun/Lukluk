import type { ExpenseItem, ConcernChecklistItem, DecisionStatus, PetTypeProfile, ActivityCard, FoodCard } from "@/lib/types";

// -- Domain types for repository --

export interface PlanningProfileWithPetType {
  id: string;
  user_id: string;
  planning_name: string | null;
  decision_status: DecisionStatus;
  pet_type: PetTypeProfile;
}

export interface OwnedProfile {
  id: string;
  pet_name: string;
  age_life_stage: string;
  got_date: string | null;
  pet_type: PetTypeProfile;
}

export interface OwnerExperienceRow {
  title: string;
  body: string;
  ownership_duration: string | null;
  created_at: string;
}

// -- Repository interface: what callers (agent tools, API routes) need --

export interface PlanningRepository {
  // Planning (Decision Agent)
  getProfile(id: string): Promise<PlanningProfileWithPetType | null>;
  getExpenses(planningProfileId: string): Promise<ExpenseItem[]>;
  getConcerns(planningProfileId: string): Promise<ConcernChecklistItem[]>;
  getOwnerExperiences(petTypeProfileId: string): Promise<OwnerExperienceRow[]>;
  replaceExpenses(planningProfileId: string, expenses: ExpenseItem[]): Promise<void>;
  replaceConcerns(planningProfileId: string, concerns: ConcernChecklistItem[]): Promise<void>;
  updateDecisionStatus(planningProfileId: string, status: DecisionStatus): Promise<void>;

  // Ownership (Care Agent)
  getOwnedProfile(ownedProfileId: string): Promise<OwnedProfile | null>;
  getActualExpenses(ownedProfileId: string): Promise<ExpenseItem[]>;
  getActivitySchedule(ownedProfileId: string): Promise<ActivityCard[]>;
  getFoodGuide(ownedProfileId: string): Promise<FoodCard[]>;
  replaceActualExpenses(ownedProfileId: string, expenses: ExpenseItem[]): Promise<void>;
  replaceActivitySchedule(ownedProfileId: string, activities: ActivityCard[]): Promise<void>;
  replaceFoodGuide(ownedProfileId: string, cards: FoodCard[]): Promise<void>;
}
