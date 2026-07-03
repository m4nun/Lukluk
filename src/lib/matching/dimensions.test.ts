import { describe, it, expect } from "vitest";
import { defaultDimensions } from "@/lib/matching/dimensions";
import type { PetTypeProfile, LifestyleProfileAnswers } from "@/lib/types";

// Helper: minimal profile factory
function profile(overrides: Partial<PetTypeProfile> = {}): PetTypeProfile {
  return {
    id: "test-pet",
    name: "Test Pet",
    species: "dog",
    breed_or_category: "Test",
    description: "",
    mbti_label: "",
    mbti_traits: [],
    mbti_description: "",
    size: "medium",
    weight_min_kg: 10,
    weight_max_kg: 20,
    lifespan_min_yrs: 10,
    lifespan_max_yrs: 14,
    coat_type: "short",
    initial_cost_min_thb: 5000,
    initial_cost_max_thb: 15000,
    monthly_cost_min_thb: 1000,
    monthly_cost_max_thb: 3000,
    annual_medical_min_thb: 3000,
    annual_medical_max_thb: 8000,
    budget_tier: "medium",
    daily_active_minutes_min: 20,
    daily_active_minutes_max: 40,
    daily_attention_hours: 2,
    alone_tolerance_hours: 6,
    time_tier: "medium",
    minimum_sq_meters: 30,
    space_tier: "apartment",
    outdoor_required: false,
    indoor_only_ok: true,
    cage_or_enclosure_ok: false,
    allergen_level: "medium",
    hypoallergenic: false,
    allergy_notes: null,
    noise_level: "moderate",
    barking_or_meowing: true,
    nocturnal_noise_risk: false,
    suitable_for_apartment: true,
    restricted_in_thailand: false,
    restricted_regions: [],
    requires_permit: false,
    cites_protected: false,
    legality_notes: null,
    dog_friendly: true,
    cat_friendly: true,
    small_pet_safe: true,
    pet_compat_notes: null,
    travel_friendly: true,
    boarding_difficulty: "easy",
    transport_notes: null,
    experience_level: "beginner",
    experience_notes: null,
    grooming_frequency: "weekly",
    grooming_complexity: "low",
    feeding_per_day: 2,
    special_diet_needs: false,
    exercise_type: "walks",
    common_health_issues: [],
    vet_visit_frequency: "annual",
    concerns: [],
    budget_match_score: 7,
    time_match_score: 7,
    space_match_score: 8,
    allergy_match_score: 5,
    noise_match_score: 6,
    travel_match_score: 7,
    existing_pets_match_score: 8,
    beginner_match_score: 9,
    child_friendly_score: 8,
    who_this_pet_for: null,
    hidden_costs: null,
    common_mistakes: null,
    adoption_advice: null,
    decision_factors: null,
    ...overrides,
  };
}

function lifestyle(overrides: Partial<LifestyleProfileAnswers> = {}): LifestyleProfileAnswers {
  return {
    budget_tier: "medium",
    time_available_hours: 2,
    space_type: "apartment",
    allergy_level: "none",
    noise_tolerance: "moderate",
    travel_frequency: "rare",
    has_existing_pets: false,
    existing_pet_types: [],
    experience_level: "beginner",
    child_in_household: false,
    ...overrides,
  };
}

describe("ScoreDimension", () => {
  it("has exactly 8 default dimensions", () => {
    expect(defaultDimensions).toHaveLength(8);
  });

  it("all weights sum to 1.0", () => {
    const sum = defaultDimensions.reduce((s, d) => s + d.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it("each dimension has a name, weight, and score function", () => {
    for (const dim of defaultDimensions) {
      expect(dim.name).toBeTruthy();
      expect(dim.weight).toBeGreaterThan(0);
      expect(typeof dim.score).toBe("function");
    }
  });

  it("budget: perfect match returns 1.0", () => {
    const dim = defaultDimensions.find((d) => d.name === "budget")!;
    const p = profile({ budget_tier: "medium" });
    const l = lifestyle({ budget_tier: "medium" });
    expect(dim.score(p, l)).toBe(1.0);
  });

  it("budget: one tier mismatch returns 0.6", () => {
    const dim = defaultDimensions.find((d) => d.name === "budget")!;
    const p = profile({ budget_tier: "high" });
    const l = lifestyle({ budget_tier: "medium" });
    expect(dim.score(p, l)).toBe(0.6);
  });

  it("budget: far mismatch returns 0.2", () => {
    const dim = defaultDimensions.find((d) => d.name === "budget")!;
    const p = profile({ budget_tier: "very_high" });
    const l = lifestyle({ budget_tier: "low" });
    expect(dim.score(p, l)).toBe(0.2);
  });

  it("allergy: no allergy user always returns 1.0", () => {
    const dim = defaultDimensions.find((d) => d.name === "allergy")!;
    const p = profile({ allergen_level: "high" });
    const l = lifestyle({ allergy_level: "none" });
    expect(dim.score(p, l)).toBe(1.0);
  });

  it("allergy: hypoallergenic pet with allergic user returns 0.9", () => {
    const dim = defaultDimensions.find((d) => d.name === "allergy")!;
    const p = profile({ allergen_level: "high", hypoallergenic: true });
    const l = lifestyle({ allergy_level: "medium" });
    expect(dim.score(p, l)).toBe(0.9);
  });

  it("space: apartment user matched with house pet returns 0.6", () => {
    const dim = defaultDimensions.find((d) => d.name === "space")!;
    const p = profile({ space_tier: "house" });
    const l = lifestyle({ space_type: "apartment" });
    expect(dim.score(p, l)).toBe(0.6);
  });

  it("space: large house pet with apartment user returns 0.1", () => {
    const dim = defaultDimensions.find((d) => d.name === "space")!;
    const p = profile({ space_tier: "large_house_outdoor" });
    const l = lifestyle({ space_type: "apartment" });
    expect(dim.score(p, l)).toBe(0.1);
  });

  it("noise: non-vocal pet returns 1.0 regardless of user tolerance", () => {
    const dim = defaultDimensions.find((d) => d.name === "noise")!;
    const p = profile({ barking_or_meowing: false });
    const l = lifestyle({ noise_tolerance: "low" });
    expect(dim.score(p, l)).toBe(1.0);
  });

  it("existing_pets: no existing pets returns 1.0", () => {
    const dim = defaultDimensions.find((d) => d.name === "existing_pets")!;
    const p = profile({ dog_friendly: false });
    const l = lifestyle({ has_existing_pets: false });
    expect(dim.score(p, l)).toBe(1.0);
  });

  it("existing_pets: incompatible pet returns 0.1", () => {
    const dim = defaultDimensions.find((d) => d.name === "existing_pets")!;
    const p = profile({ dog_friendly: false });
    const l = lifestyle({ has_existing_pets: true, existing_pet_types: ["dog"] });
    expect(dim.score(p, l)).toBe(0.1);
  });

  it("explain: budget gap returns signal", () => {
    const dim = defaultDimensions.find((d) => d.name === "budget")!;
    const p = profile({ budget_tier: "very_high" });
    const l = lifestyle({ budget_tier: "low" });
    expect(dim.explain!(p, l)).toBe("budget gap");
  });

  it("explain: space mismatch returns signal", () => {
    const dim = defaultDimensions.find((d) => d.name === "space")!;
    const p = profile({ space_tier: "large_house_outdoor" });
    const l = lifestyle({ space_type: "apartment" });
    expect(dim.explain!(p, l)).toBe("space mismatch");
  });

  it("explain: no issue returns null", () => {
    const dim = defaultDimensions.find((d) => d.name === "budget")!;
    const p = profile({ budget_tier: "medium" });
    const l = lifestyle({ budget_tier: "medium" });
    expect(dim.explain!(p, l)).toBeNull();
  });
});
