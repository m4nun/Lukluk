// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {}

// ---- Domain Types ----

export type Species = "dog" | "cat" | "rabbit" | "bird" | "fish" | "reptile" | "small_mammal" | "other";

export type BudgetTier = "low" | "medium" | "high" | "very_high";
export type TimeTier = "low" | "medium" | "high";
export type SpaceTier = "apartment" | "house" | "large_house_outdoor";
export type AllergenLevel = "none" | "low" | "medium" | "high";
export type NoiseLevel = "silent" | "quiet" | "moderate" | "vocal" | "very_vocal";
export type BoardingDifficulty = "easy" | "moderate" | "hard";
export type ExperienceLevel = "beginner" | "intermediate" | "experienced";

export type DecisionStatus = "exploring" | "considering" | "ready_to_buy" | "not_a_fit" | "already_have";
export type AgentDraftStatus = "pending" | "confirmed" | "rejected" | "stale";
export type AgentType = "decision" | "care";
export type SubscriptionStatus = "inactive" | "active" | "past_due" | "canceled";
export type ConcernStatus = "unresolved" | "resolved" | "not_applicable";

// ---- Pet Type Profile (denormalized from YAML → Supabase) ----

export interface PetTypeProfile {
  id: string;
  name: string;
  species: Species;
  breed_or_category: string;
  description: string;
  mbti_label: string;
  mbti_traits: string[];
  mbti_description: string;
  // appearance
  size: string;
  weight_min_kg: number;
  weight_max_kg: number;
  lifespan_min_yrs: number;
  lifespan_max_yrs: number;
  coat_type: string;
  // budget
  initial_cost_min_thb: number;
  initial_cost_max_thb: number;
  monthly_cost_min_thb: number;
  monthly_cost_max_thb: number;
  annual_medical_min_thb: number;
  annual_medical_max_thb: number;
  budget_tier: BudgetTier;
  // time
  daily_active_minutes_min: number;
  daily_active_minutes_max: number;
  daily_attention_hours: number;
  alone_tolerance_hours: number;
  time_tier: TimeTier;
  // space
  minimum_sq_meters: number;
  space_tier: SpaceTier;
  outdoor_required: boolean;
  indoor_only_ok: boolean;
  cage_or_enclosure_ok: boolean;
  // allergies
  allergen_level: AllergenLevel;
  hypoallergenic: boolean;
  allergy_notes: string | null;
  // noise
  noise_level: NoiseLevel;
  barking_or_meowing: boolean;
  nocturnal_noise_risk: boolean;
  suitable_for_apartment: boolean;
  // legality
  restricted_in_thailand: boolean;
  restricted_regions: string[];
  requires_permit: boolean;
  cites_protected: boolean;
  legality_notes: string | null;
  // existing pets
  dog_friendly: boolean;
  cat_friendly: boolean;
  small_pet_safe: boolean;
  pet_compat_notes: string | null;
  // travel
  travel_friendly: boolean;
  boarding_difficulty: BoardingDifficulty;
  transport_notes: string | null;
  // experience
  experience_level: ExperienceLevel;
  experience_notes: string | null;
  // care
  grooming_frequency: string;
  grooming_complexity: string;
  feeding_per_day: number;
  special_diet_needs: boolean;
  exercise_type: string;
  common_health_issues: string[];
  vet_visit_frequency: string;
  // concerns
  concerns: Concern[];
  // matching scores
  budget_match_score: number;
  time_match_score: number;
  space_match_score: number;
  allergy_match_score: number;
  noise_match_score: number;
  travel_match_score: number;
  existing_pets_match_score: number;
  beginner_match_score: number;
  child_friendly_score: number;
  // agent guidance
  who_this_pet_for: string | null;
  hidden_costs: string | null;
  common_mistakes: string | null;
  adoption_advice: string | null;
  decision_factors: string | null;
}

export interface Concern {
  id: string;
  title: string;
  severity: "minor" | "moderate" | "major";
  description: string;
}

// ---- Matching Types ----

export interface LifestyleProfileAnswers {
  budget_tier: BudgetTier;
  time_available_hours: number;
  space_type: SpaceTier;
  allergy_level: AllergenLevel;
  noise_tolerance: "low" | "moderate" | "high";
  travel_frequency: "rare" | "occasional" | "frequent";
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

// ---- Expense / Checklist Types ----

export interface ExpenseItem {
  category: "initial" | "monthly" | "annual" | "one_time" | "food" | "medical" | "grooming" | "supplies" | "other";
  item: string;
  amount_thb: number;
  note?: string | null;
}

export interface ConcernChecklistItem {
  concern_id: string;
  title: string;
  status: ConcernStatus;
  note?: string | null;
}

// ---- Activity Interest ----

export interface ActivityCard {
  id: string;
  name: string;
  icon: string;
  image?: string | null;
  difficulty: "easy" | "medium" | "hard";
  duration: string;
  frequency: string;
  notes?: string | null;
}

// Keep for backward compatibility
export type ActivityInterest = ActivityCard;

// ---- Food Card ----

export interface FoodCard {
  id: string;
  name: string;
  brand: string;
  amount: string;
  frequency: string;
  image?: string | null;
  notes?: string | null;
}

// ---- Owner Experience ----

export interface OwnerExperience {
  id: string;
  user_id: string;
  pet_type_profile_id: string;
  has_owned: boolean;
  ownership_duration: string | null;
  pet_name_or_number: string | null;
  title: string;
  body: string;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

// ---- Agent Draft ----

export interface AgentDraft {
  id: string;
  planning_pet_profile_id: string;
  target: "estimated_expenses" | "concern_checklist" | "decision_status" | "actual_expenses" | "activity_schedule" | "food_guide";
  field_path: string | null;
  current_value: unknown;
  proposed_value: unknown;
  status: AgentDraftStatus;
}
