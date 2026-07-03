import type { PetTypeProfile, LifestyleProfileAnswers } from "@/lib/types";

// ---- ScoreDimension interface ----
// Each dimension knows its own weight, how to score a profile against a lifestyle, and what to look for in explanations.

export interface ScoreDimension {
  name: string;
  weight: number; // 0-1, all dimensions should sum to 1
  score(profile: PetTypeProfile, lifestyle: LifestyleProfileAnswers): number; // 0-1
  explain?(profile: PetTypeProfile, lifestyle: LifestyleProfileAnswers): string | null;
}

// ---- Built-in dimensions ----

const budgetDimension: ScoreDimension = {
  name: "budget",
  weight: 0.20,
  score(profile, lifestyle) {
    const tiers: Record<string, number> = { low: 1, medium: 2, high: 3, very_high: 4 };
    const profileTier = tiers[profile.budget_tier] || 2;
    const userTier = tiers[lifestyle.budget_tier] || 2;
    if (userTier >= profileTier) return 1.0;
    if (userTier >= profileTier - 1) return 0.6;
    return 0.2;
  },
  explain(profile, lifestyle) {
    if (profile.budget_tier === "very_high" && lifestyle.budget_tier !== "very_high") return "budget gap";
    return null;
  },
};

const timeDimension: ScoreDimension = {
  name: "time",
  weight: 0.15,
  score(profile, lifestyle) {
    const avgActive = (profile.daily_active_minutes_min + profile.daily_active_minutes_max) / 2;
    const ratio = lifestyle.time_available_hours > 0
      ? Math.min(1, (lifestyle.time_available_hours * 60) / avgActive)
      : 0;
    if (ratio >= 1) return 1.0;
    if (ratio >= 0.7) return 0.8;
    if (ratio >= 0.5) return 0.5;
    return 0.2;
  },
};

const spaceDimension: ScoreDimension = {
  name: "space",
  weight: 0.10,
  score(profile, lifestyle) {
    const spaceTiers: Record<string, number> = { apartment: 1, house: 2, large_house_outdoor: 3 };
    const profileSpace = spaceTiers[profile.space_tier] || 2;
    const userSpace = spaceTiers[lifestyle.space_type] || 2;
    if (userSpace >= profileSpace) return 1.0;
    if (userSpace >= profileSpace - 1) return 0.6;
    return 0.1;
  },
  explain(profile, lifestyle) {
    if (profile.space_tier === "large_house_outdoor" && lifestyle.space_type === "apartment") return "space mismatch";
    return null;
  },
};

const allergyDimension: ScoreDimension = {
  name: "allergy",
  weight: 0.15,
  score(profile, lifestyle) {
    const allergenLevels: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
    const profileAllergen = allergenLevels[profile.allergen_level] || 2;
    const userAllergen = allergenLevels[lifestyle.allergy_level] || 0;
    if (userAllergen === 0) return 1.0;
    if (profile.hypoallergenic) return 0.9;
    if (profileAllergen <= userAllergen) return 0.6;
    if (profileAllergen - userAllergen === 1) return 0.3;
    return 0.1;
  },
  explain(profile, lifestyle) {
    if (lifestyle.allergy_level !== "none" && profile.allergen_level === "high" && !profile.hypoallergenic) return "allergy concern";
    return null;
  },
};

const noiseDimension: ScoreDimension = {
  name: "noise",
  weight: 0.10,
  score(profile, lifestyle) {
    if (!profile.barking_or_meowing) return 1.0;
    const tolerance: Record<string, number> = { high: 1, moderate: 0.6, low: 0.2 };
    const noiseLevels: Record<string, number> = { silent: 0, quiet: 0.2, moderate: 0.5, vocal: 0.8, very_vocal: 1 };
    const profileNoise = noiseLevels[profile.noise_level] || 0.5;
    const userTolerance = tolerance[lifestyle.noise_tolerance] || 0.6;
    if (userTolerance >= 0.8) return 1.0;
    if (profileNoise <= 0.2) return 1.0;
    return userTolerance;
  },
  explain(profile, lifestyle) {
    if (profile.noise_level === "very_vocal" && lifestyle.noise_tolerance === "low") return "noise conflict";
    return null;
  },
};

const travelDimension: ScoreDimension = {
  name: "travel",
  weight: 0.10,
  score(profile, lifestyle) {
    const difficulty: Record<string, number> = { easy: 1, moderate: 0.7, hard: 0.3 };
    const freq: Record<string, number> = { rare: 1, occasional: 0.7, frequent: 0.4 };
    const travelDiff = difficulty[profile.boarding_difficulty] || 0.7;
    const userFreq = freq[lifestyle.travel_frequency] || 0.7;
    if (lifestyle.travel_frequency === "rare") return 1.0;
    if (profile.travel_friendly) return 0.9;
    return Math.max(0.2, travelDiff * userFreq);
  },
};

const existingPetsDimension: ScoreDimension = {
  name: "existing_pets",
  weight: 0.10,
  score(profile, lifestyle) {
    if (!lifestyle.has_existing_pets) return 1.0;
    const existingTypes = new Set(lifestyle.existing_pet_types);
    if (existingTypes.has("dog") && !profile.dog_friendly) return 0.1;
    if (existingTypes.has("cat") && !profile.cat_friendly) return 0.1;
    if ((existingTypes.has("rabbit") || existingTypes.has("bird") || existingTypes.has("fish")) && !profile.small_pet_safe) return 0.1;
    return 1.0;
  },
};

const experienceDimension: ScoreDimension = {
  name: "experience",
  weight: 0.10,
  score(profile, lifestyle) {
    const expLevels: Record<string, number> = { beginner: 1, intermediate: 2, experienced: 3 };
    const profileExp = expLevels[profile.experience_level] || 2;
    const userExp = expLevels[lifestyle.experience_level] || 1;
    if (userExp >= profileExp) return 1.0;
    if (userExp >= profileExp - 1) return 0.7;
    return 0.3;
  },
};

export const defaultDimensions: ScoreDimension[] = [
  budgetDimension,
  timeDimension,
  spaceDimension,
  allergyDimension,
  noiseDimension,
  travelDimension,
  existingPetsDimension,
  experienceDimension,
];
