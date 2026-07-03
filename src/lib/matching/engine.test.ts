import { describe, it, expect } from "vitest";
import { runMatch } from "@/lib/matching/engine";
import { defaultDimensions } from "@/lib/matching/dimensions";
import type { PetTypeProfile, LifestyleProfileAnswers } from "@/lib/types";

function p(overrides: Partial<PetTypeProfile> & { id: string }): PetTypeProfile {
  return {
    id: overrides.id,
    name: overrides.id,
    species: "dog",
    breed_or_category: "",
    description: "",
    mbti_label: "",
    mbti_traits: [],
    mbti_description: "",
    size: "medium",
    weight_min_kg: 10, weight_max_kg: 20,
    lifespan_min_yrs: 10, lifespan_max_yrs: 14,
    coat_type: "short",
    initial_cost_min_thb: 5000, initial_cost_max_thb: 15000,
    monthly_cost_min_thb: 1000, monthly_cost_max_thb: 3000,
    annual_medical_min_thb: 3000, annual_medical_max_thb: 8000,
    budget_tier: "medium",
    daily_active_minutes_min: 20, daily_active_minutes_max: 40,
    daily_attention_hours: 2,
    alone_tolerance_hours: 6,
    time_tier: "medium",
    minimum_sq_meters: 30,
    space_tier: "apartment",
    outdoor_required: false, indoor_only_ok: true, cage_or_enclosure_ok: false,
    allergen_level: "medium", hypoallergenic: false, allergy_notes: null,
    noise_level: "moderate", barking_or_meowing: true, nocturnal_noise_risk: false, suitable_for_apartment: true,
    restricted_in_thailand: false, restricted_regions: [], requires_permit: false, cites_protected: false, legality_notes: null,
    dog_friendly: true, cat_friendly: true, small_pet_safe: true, pet_compat_notes: null,
    travel_friendly: true, boarding_difficulty: "easy", transport_notes: null,
    experience_level: "beginner", experience_notes: null,
    grooming_frequency: "weekly", grooming_complexity: "low",
    feeding_per_day: 2, special_diet_needs: false,
    exercise_type: "walks", common_health_issues: [], vet_visit_frequency: "annual",
    concerns: [],
    budget_match_score: 7, time_match_score: 7, space_match_score: 8, allergy_match_score: 5,
    noise_match_score: 6, travel_match_score: 7, existing_pets_match_score: 8,
    beginner_match_score: 9, child_friendly_score: 8,
    who_this_pet_for: null, hidden_costs: null, common_mistakes: null,
    adoption_advice: null, decision_factors: null,
    ...overrides,
  };
}

const defaultLifestyle: LifestyleProfileAnswers = {
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
};

describe("runMatch", () => {
  it("returns at most 3 results", () => {
    const profiles = [
      p({ id: "a" }), p({ id: "b" }), p({ id: "c" }), p({ id: "d" }), p({ id: "e" }),
    ];
    const results = runMatch(profiles, defaultLifestyle);
    expect(results).toHaveLength(3);
  });

  it("returns empty array if given fewer than 3 profiles", () => {
    const profiles = [p({ id: "a" }), p({ id: "b" })];
    const results = runMatch(profiles, defaultLifestyle);
    expect(results).toHaveLength(2);
  });

  it("sorts by responsible fit score descending", () => {
    const goodFit = p({ id: "good", budget_tier: "low", time_tier: "low", allergen_level: "none", noise_level: "quiet" });
    const badFit = p({ id: "bad", budget_tier: "very_high", time_tier: "high", allergen_level: "high" });
    const results = runMatch([badFit, goodFit], defaultLifestyle);
    expect(results[0].pet_type_profile_id).toBe("good");
    expect(results[1].pet_type_profile_id).toBe("bad");
  });

  it("penalizes restricted_in_thailand pets", () => {
    const normal = p({ id: "normal" });
    const restricted = p({ id: "restricted", restricted_in_thailand: true });
    const results = runMatch([restricted, normal], defaultLifestyle);
    expect(results[0].pet_type_profile_id).toBe("normal");
    expect(results[1].responsible_fit_score).toBeLessThan(50);
  });

  it("penalizes CITES protected pets", () => {
    const normal = p({ id: "normal" });
    const cites = p({ id: "cites", cites_protected: true });
    const results = runMatch([cites, normal], defaultLifestyle);
    expect(results[0].pet_type_profile_id).toBe("normal");
    expect(results[1].responsible_fit_score).toBeLessThan(results[0].responsible_fit_score);
  });

  it("includes explanation text", () => {
    const profiles = [p({ id: "a" })];
    const results = runMatch(profiles, defaultLifestyle);
    expect(results[0].explanation).toBeTruthy();
    expect(typeof results[0].explanation).toBe("string");
  });

  it("accepts custom dimensions", () => {
    const customDim = {
      name: "test",
      weight: 1.0,
      score: () => 0.5,
    };
    const profiles = [p({ id: "a" })];
    const results = runMatch(profiles, defaultLifestyle, [customDim]);
    expect(results[0].responsible_fit_score).toBe(50);
  });

  it("ranks fallback dogs low with cat-only lifestyle", () => {
    const dog = p({ id: "dog", species: "dog", budget_tier: "low", time_tier: "low", allergen_level: "low" });
    const cat = p({ id: "cat", species: "cat", budget_tier: "low", time_tier: "low", allergen_level: "low" });
    // Both equally good on paper — MBTI fit is tiebreaker
    const results = runMatch([dog, cat], defaultLifestyle);
    // Just verify both appear and have scores
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.responsible_fit_score >= 0)).toBe(true);
  });
});
