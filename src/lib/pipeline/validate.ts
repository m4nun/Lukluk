import { z } from "zod";

export const concernSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  severity: z.enum(["minor", "moderate", "major"]),
  description: z.string().min(1),
});

export const petTypeProfileYamlSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, "must be kebab-case slug"),
  name: z.string().min(1),
  species: z.enum(["dog", "cat", "rabbit", "bird", "fish", "reptile", "small_mammal", "other"]),
  breed_or_category: z.string().min(1),
  description: z.string().min(1),

  mbti_label: z.string().min(1),
  mbti_traits: z.array(z.string()).min(3).max(5),
  mbti_description: z.string().min(1),

  appearance: z.object({
    size: z.enum(["small", "medium", "large", "extra_large"]),
    weight_range_kg: z.tuple([z.number(), z.number()]),
    lifespan_years: z.tuple([z.number(), z.number()]),
    coat_type: z.string().min(1),
  }),

  budget: z.object({
    initial_cost_thb: z.tuple([z.number().min(0), z.number().min(0)]),
    monthly_cost_thb: z.tuple([z.number().min(0), z.number().min(0)]),
    annual_medical_thb: z.tuple([z.number().min(0), z.number().min(0)]),
    budget_tier: z.enum(["low", "medium", "high", "very_high"]),
  }),

  time: z.object({
    daily_active_minutes: z.tuple([z.number().min(0), z.number().min(0)]),
    daily_attention_hours: z.number().min(0),
    alone_tolerance_hours: z.number().min(0),
    time_tier: z.enum(["low", "medium", "high"]),
  }),

  space: z.object({
    minimum_sq_meters: z.number().min(0),
    space_tier: z.enum(["apartment", "house", "large_house_outdoor"]),
    outdoor_required: z.boolean(),
    indoor_only_ok: z.boolean(),
    cage_or_enclosure_ok: z.boolean(),
  }),

  allergies: z.object({
    allergen_level: z.enum(["none", "low", "medium", "high"]),
    hypoallergenic: z.boolean(),
    notes: z.string().nullable().optional(),
  }),

  noise: z.object({
    noise_level: z.enum(["silent", "quiet", "moderate", "vocal", "very_vocal"]),
    barking_or_meowing: z.boolean(),
    nocturnal_noise_risk: z.boolean(),
    suitable_for_apartment: z.boolean(),
  }),

  legality: z.object({
    restricted_in_thailand: z.boolean(),
    restricted_regions: z.array(z.string()),
    requires_permit: z.boolean(),
    cites_protected: z.boolean(),
    notes: z.string().nullable().optional(),
  }),

  existing_pets: z.object({
    dog_friendly: z.boolean(),
    cat_friendly: z.boolean(),
    small_pet_safe: z.boolean(),
    notes: z.string().nullable().optional(),
  }),

  travel: z.object({
    travel_friendly: z.boolean(),
    boarding_difficulty: z.enum(["easy", "moderate", "hard"]),
    transport_notes: z.string().nullable().optional(),
  }),

  experience: z.object({
    experience_level: z.enum(["beginner", "intermediate", "experienced"]),
    notes: z.string().nullable().optional(),
  }),

  care: z.object({
    grooming_frequency: z.string().min(1),
    grooming_complexity: z.enum(["low", "medium", "high"]),
    feeding_frequency_per_day: z.number().min(1),
    special_diet_needs: z.boolean(),
    exercise_type: z.string().min(1),
    common_health_issues: z.array(z.string()),
    vet_visit_frequency: z.string().min(1),
  }),

  concerns: z.array(concernSchema).min(1).max(10),

  matching: z.object({
    trait_scores: z.object({
      budget_match: z.number().int().min(1).max(10),
      time_match: z.number().int().min(1).max(10),
      space_match: z.number().int().min(1).max(10),
      allergy_match: z.number().int().min(1).max(10),
      noise_match: z.number().int().min(1).max(10),
      travel_match: z.number().int().min(1).max(10),
      existing_pets_match: z.number().int().min(1).max(10),
      beginner_match: z.number().int().min(1).max(10),
      child_friendly: z.number().int().min(1).max(10),
    }),
  }),

  agent_guidance: z.object({
    who_is_this_pet_for: z.string().optional(),
    hidden_costs: z.string().optional(),
    common_mistakes: z.string().optional(),
    adoption_advice: z.string().optional(),
    decision_factors: z.string().optional(),
  }),

  meta: z.object({
    version: z.string().min(1),
    last_updated: z.string().min(1),
    sources: z.array(z.string()),
  }),
});

export type PetTypeProfileYaml = z.infer<typeof petTypeProfileYamlSchema>;

export function validatePetProfile(data: unknown): { success: true; data: PetTypeProfileYaml } | { success: false; errors: string[] } {
  const result = petTypeProfileYamlSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  return { success: true, data: result.data };
}

export function consistencyCheck(profile: PetTypeProfileYaml): string[] {
  const warnings: string[] = [];

  // Budget tier consistency
  const avgMonthly = (profile.budget.monthly_cost_thb[0] + profile.budget.monthly_cost_thb[1]) / 2;
  if (profile.budget.budget_tier === "low" && avgMonthly > 1000) {
    warnings.push(`Budget tier is "low" but monthly cost avg is ${avgMonthly} THB`);
  }
  if (profile.budget.budget_tier === "very_high" && avgMonthly < 5000) {
    warnings.push(`Budget tier is "very_high" but monthly cost avg is only ${avgMonthly} THB`);
  }

  // Time tier consistency
  const avgActive = (profile.time.daily_active_minutes[0] + profile.time.daily_active_minutes[1]) / 2;
  if (profile.time.time_tier === "low" && avgActive > 30) {
    warnings.push(`Time tier is "low" but avg active minutes is ${avgActive}`);
  }
  if (profile.time.time_tier === "high" && avgActive < 60) {
    warnings.push(`Time tier is "high" but avg active minutes is only ${avgActive}`);
  }

  // Space consistency
  if (profile.space.space_tier === "apartment" && profile.space.minimum_sq_meters > 80) {
    warnings.push(`Space tier is "apartment" but requires ${profile.space.minimum_sq_meters} sqm minimum`);
  }

  // Hypoallergenic claim vs allergen level
  if (profile.allergies.hypoallergenic && profile.allergies.allergen_level !== "none" && profile.allergies.allergen_level !== "low") {
    warnings.push(`Marked hypoallergenic but allergen level is "${profile.allergies.allergen_level}"`);
  }

  // Safety: no price inconsistencies
  if (profile.budget.initial_cost_thb[0] > profile.budget.initial_cost_thb[1]) {
    warnings.push("initial_cost_thb min > max");
  }
  if (profile.budget.monthly_cost_thb[0] > profile.budget.monthly_cost_thb[1]) {
    warnings.push("monthly_cost_thb min > max");
  }
  if (profile.budget.annual_medical_thb[0] > profile.budget.annual_medical_thb[1]) {
    warnings.push("annual_medical_thb min > max");
  }

  return warnings;
}
