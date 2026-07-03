import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import { validatePetProfile, consistencyCheck, type PetTypeProfileYaml } from "./validate";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const POOLS_DIR = path.join(process.cwd(), "pet_pools");

export async function seedPetTypeProfiles(): Promise<{ seeded: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let seeded = 0;
  let skipped = 0;

  if (!fs.existsSync(POOLS_DIR)) {
    return { seeded: 0, skipped: 0, errors: [`Directory not found: ${POOLS_DIR}`] };
  }

  const files = fs.readdirSync(POOLS_DIR).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  for (const file of files) {
    const filePath = path.join(POOLS_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = yaml.load(raw);

      // Validate against schema
      const validation = validatePetProfile(parsed);
      if (!validation.success) {
        errors.push(`${file}: validation failed - ${validation.errors.join("; ")}`);
        skipped++;
        continue;
      }

      const profile = validation.data;

      // Consistency checks (warnings only, don't block)
      const warnings = consistencyCheck(profile);
      if (warnings.length > 0) {
        errors.push(`${file}: warnings - ${warnings.join("; ")}`);
        // Continue anyway — warnings are not fatal
      }

      // Transform YAML to DB row
      const row = transformYamlToDbRow(profile);

      // Upsert into Supabase
      const { error } = await getSupabaseAdmin()
        .from("pet_type_profiles")
        .upsert(row, { onConflict: "id" });

      if (error) {
        errors.push(`${file}: db insert failed - ${error.message}`);
        skipped++;
      } else {
        seeded++;
      }
    } catch (err) {
      errors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
    }
  }

  return { seeded, skipped, errors };
}

function transformYamlToDbRow(profile: PetTypeProfileYaml) {
  return {
    id: profile.id,
    name: profile.name,
    species: profile.species,
    breed_or_category: profile.breed_or_category,
    description: profile.description,
    mbti_label: profile.mbti_label,
    mbti_traits: profile.mbti_traits,
    mbti_description: profile.mbti_description,

    // Appearance
    size: profile.appearance.size,
    weight_min_kg: profile.appearance.weight_range_kg[0],
    weight_max_kg: profile.appearance.weight_range_kg[1],
    lifespan_min_yrs: profile.appearance.lifespan_years[0],
    lifespan_max_yrs: profile.appearance.lifespan_years[1],
    coat_type: profile.appearance.coat_type,

    // Budget
    initial_cost_min_thb: profile.budget.initial_cost_thb[0],
    initial_cost_max_thb: profile.budget.initial_cost_thb[1],
    monthly_cost_min_thb: profile.budget.monthly_cost_thb[0],
    monthly_cost_max_thb: profile.budget.monthly_cost_thb[1],
    annual_medical_min_thb: profile.budget.annual_medical_thb[0],
    annual_medical_max_thb: profile.budget.annual_medical_thb[1],
    budget_tier: profile.budget.budget_tier,

    // Time
    daily_active_minutes_min: profile.time.daily_active_minutes[0],
    daily_active_minutes_max: profile.time.daily_active_minutes[1],
    daily_attention_hours: profile.time.daily_attention_hours,
    alone_tolerance_hours: profile.time.alone_tolerance_hours,
    time_tier: profile.time.time_tier,

    // Space
    minimum_sq_meters: profile.space.minimum_sq_meters,
    space_tier: profile.space.space_tier,
    outdoor_required: profile.space.outdoor_required,
    indoor_only_ok: profile.space.indoor_only_ok,
    cage_or_enclosure_ok: profile.space.cage_or_enclosure_ok,

    // Allergies
    allergen_level: profile.allergies.allergen_level,
    hypoallergenic: profile.allergies.hypoallergenic,
    allergy_notes: profile.allergies.notes ?? null,

    // Noise
    noise_level: profile.noise.noise_level,
    barking_or_meowing: profile.noise.barking_or_meowing,
    nocturnal_noise_risk: profile.noise.nocturnal_noise_risk,
    suitable_for_apartment: profile.noise.suitable_for_apartment,

    // Legality
    restricted_in_thailand: profile.legality.restricted_in_thailand,
    restricted_regions: profile.legality.restricted_regions,
    requires_permit: profile.legality.requires_permit,
    cites_protected: profile.legality.cites_protected,
    legality_notes: profile.legality.notes ?? null,

    // Existing pets
    dog_friendly: profile.existing_pets.dog_friendly,
    cat_friendly: profile.existing_pets.cat_friendly,
    small_pet_safe: profile.existing_pets.small_pet_safe,
    pet_compat_notes: profile.existing_pets.notes ?? null,

    // Travel
    travel_friendly: profile.travel.travel_friendly,
    boarding_difficulty: profile.travel.boarding_difficulty,
    transport_notes: profile.travel.transport_notes ?? null,

    // Experience
    experience_level: profile.experience.experience_level,
    experience_notes: profile.experience.notes ?? null,

    // Care
    grooming_frequency: profile.care.grooming_frequency,
    grooming_complexity: profile.care.grooming_complexity,
    feeding_per_day: profile.care.feeding_frequency_per_day,
    special_diet_needs: profile.care.special_diet_needs,
    exercise_type: profile.care.exercise_type,
    common_health_issues: profile.care.common_health_issues,
    vet_visit_frequency: profile.care.vet_visit_frequency,

    // Concerns
    concerns: profile.concerns,

    // Matching scores
    budget_match_score: profile.matching.trait_scores.budget_match,
    time_match_score: profile.matching.trait_scores.time_match,
    space_match_score: profile.matching.trait_scores.space_match,
    allergy_match_score: profile.matching.trait_scores.allergy_match,
    noise_match_score: profile.matching.trait_scores.noise_match,
    travel_match_score: profile.matching.trait_scores.travel_match,
    existing_pets_match_score: profile.matching.trait_scores.existing_pets_match,
    beginner_match_score: profile.matching.trait_scores.beginner_match,
    child_friendly_score: profile.matching.trait_scores.child_friendly,

    // Agent guidance
    who_this_pet_for: profile.agent_guidance.who_is_this_pet_for ?? null,
    hidden_costs: profile.agent_guidance.hidden_costs ?? null,
    common_mistakes: profile.agent_guidance.common_mistakes ?? null,
    adoption_advice: profile.agent_guidance.adoption_advice ?? null,
    decision_factors: profile.agent_guidance.decision_factors ?? null,

    // Meta
    version: profile.meta.version,
    last_updated: profile.meta.last_updated,
    sources: profile.meta.sources,
  };
}
