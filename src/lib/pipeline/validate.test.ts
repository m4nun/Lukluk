import { describe, it, expect } from "vitest";
import { validatePetProfile, consistencyCheck } from "@/lib/pipeline/validate";

const validProfile = {
  id: "test-pet",
  name: "Test Pet",
  species: "dog" as const,
  breed_or_category: "Test Breed",
  description: "A test pet.",
  mbti_label: "TEST",
  mbti_traits: ["Calm", "Friendly", "Smart"],
  mbti_description: "MBTI desc",
  appearance: {
    size: "medium" as const,
    weight_range_kg: [10, 20],
    lifespan_years: [8, 14],
    coat_type: "short",
  },
  budget: {
    initial_cost_thb: [5000, 15000],
    monthly_cost_thb: [1000, 3000],
    annual_medical_thb: [3000, 8000],
    budget_tier: "medium" as const,
  },
  time: {
    daily_active_minutes: [20, 40],
    daily_attention_hours: 2,
    alone_tolerance_hours: 6,
    time_tier: "medium" as const,
  },
  space: {
    minimum_sq_meters: 30,
    space_tier: "apartment" as const,
    outdoor_required: false,
    indoor_only_ok: true,
    cage_or_enclosure_ok: false,
  },
  allergies: {
    allergen_level: "medium" as const,
    hypoallergenic: false,
  },
  noise: {
    noise_level: "moderate" as const,
    barking_or_meowing: true,
    nocturnal_noise_risk: false,
    suitable_for_apartment: true,
  },
  legality: {
    restricted_in_thailand: false,
    restricted_regions: [],
    requires_permit: false,
    cites_protected: false,
  },
  existing_pets: {
    dog_friendly: true,
    cat_friendly: true,
    small_pet_safe: true,
  },
  travel: {
    travel_friendly: true,
    boarding_difficulty: "easy" as const,
  },
  experience: {
    experience_level: "beginner" as const,
  },
  care: {
    grooming_frequency: "weekly",
    grooming_complexity: "low" as const,
    feeding_frequency_per_day: 2,
    special_diet_needs: false,
    exercise_type: "walks",
    common_health_issues: ["none"],
    vet_visit_frequency: "annual",
  },
  concerns: [
    { id: "test-concern", title: "Test", severity: "minor" as const, description: "desc" },
  ],
  matching: {
    trait_scores: {
      budget_match: 7,
      time_match: 7,
      space_match: 8,
      allergy_match: 5,
      noise_match: 6,
      travel_match: 7,
      existing_pets_match: 8,
      beginner_match: 9,
      child_friendly: 8,
    },
  },
  agent_guidance: {},
  meta: {
    version: "1.0.0",
    last_updated: "2026-01-01",
    sources: ["test"],
  },
};

describe("validatePetProfile", () => {
  it("accepts a valid profile", () => {
    const result = validatePetProfile(validProfile);
    expect(result.success).toBe(true);
  });

  it("rejects missing required field", () => {
    const { name, ...incomplete } = validProfile;
    const result = validatePetProfile(incomplete);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes("name"))).toBe(true);
    }
  });

  it("rejects non-kebab-case id", () => {
    const result = validatePetProfile({ ...validProfile, id: "Bad ID With Spaces" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid species", () => {
    const result = validatePetProfile({ ...validProfile, species: "dragon" });
    expect(result.success).toBe(false);
  });

  it("rejects mbti_traits with fewer than 3 items", () => {
    const result = validatePetProfile({ ...validProfile, mbti_traits: ["only one"] });
    expect(result.success).toBe(false);
  });

  it("rejects mbti_traits with more than 5 items", () => {
    const result = validatePetProfile({
      ...validProfile,
      mbti_traits: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects score out of 1-10 range", () => {
    const result = validatePetProfile({
      ...validProfile,
      matching: {
        ...validProfile.matching,
        trait_scores: { ...validProfile.matching.trait_scores, budget_match: 11 },
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("consistencyCheck", () => {
  it("passes for a consistent profile", () => {
    const warnings = consistencyCheck(validProfile);
    expect(warnings).toHaveLength(0);
  });

  it("warns when budget tier is low but costs are high", () => {
    const p = {
      ...validProfile,
      budget: {
        ...validProfile.budget,
        budget_tier: "low" as const,
        monthly_cost_thb: [3000, 5000],
      },
    };
    const warnings = consistencyCheck(p);
    expect(warnings.some((w) => w.toLowerCase().includes("budget"))).toBe(true);
  });

  it("warns on reversed cost ranges", () => {
    const p = {
      ...validProfile,
      budget: {
        ...validProfile.budget,
        initial_cost_thb: [15000, 5000],
      },
    };
    const warnings = consistencyCheck(p);
    expect(warnings.some((w) => w.includes("min > max"))).toBe(true);
  });

  it("warns when hypoallergenic claim conflicts with allergen level", () => {
    const p = {
      ...validProfile,
      allergies: { ...validProfile.allergies, hypoallergenic: true, allergen_level: "high" as const },
    };
    const warnings = consistencyCheck(p);
    expect(warnings.some((w) => w.includes("hypoallergenic"))).toBe(true);
  });
});
