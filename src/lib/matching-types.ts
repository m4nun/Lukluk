import type { BudgetTier, SpaceTier, AllergenLevel, ExperienceLevel } from "./types";

export type NoiseTolerance = "low" | "moderate" | "high";
export type TravelFrequency = "rare" | "occasional" | "frequent";

export interface LifestyleProfileAnswers {
  budget_tier: BudgetTier;
  time_available_hours: number;
  space_type: SpaceTier;
  allergy_level: AllergenLevel;
  noise_tolerance: NoiseTolerance;
  travel_frequency: TravelFrequency;
  has_existing_pets: boolean;
  existing_pet_types: string[];
  experience_level: ExperienceLevel;
  child_in_household: boolean;
}

export interface FollowUpQuestion {
  question: string;
  answer?: string;
}

export interface MatchResultEntry {
  pet_type_profile_id: string;
  rank: number;
  responsible_fit_score: number;
  mbti_match_score: number;
  explanation: string;
}
