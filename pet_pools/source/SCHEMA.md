# Pet Type Profile Schema v1
#
# Each Pet Type Profile is a YAML file representing global knowledge about a pet type.
# It contains both machine-readable scoring fields (for matching) and guidance text (for agents).
# It must NOT contain any user-specific data.

# ---- Identity ----
id: string              # unique slug, e.g. "golden-retriever"
name: string            # display name, e.g. "Golden Retriever"
species: string         # "dog" | "cat" | "rabbit" | "bird" | "fish" | "reptile" | "other"
breed_or_category: string  # breed name or general category
description: string     # 1-2 sentence overview for match results

# ---- Pet MBTI (personality label, NOT scientific) ----
mbti_label: string      # e.g. "ENFP — The Enthusiastic Companion"
mbti_traits:            # 3-5 key personality traits for display
  - string
mbti_description: string  # longer personality narrative for agents

# ---- Appearance (for Match Card and agent context) ----
appearance:
  size: "small" | "medium" | "large" | "extra_large"
  weight_range_kg: [number, number]
  lifespan_years: [number, number]
  coat_type: string     # e.g. "short", "long", "hairless", "feathered", "scaled"

# ---- Responsible Fit: Budget ----
budget:
  initial_cost_thb: [number, number]   # adoption/purchase cost range
  monthly_cost_thb: [number, number]   # food, supplies, routine care
  annual_medical_thb: [number, number] # vet, vaccines, checkups
  budget_tier: "low" | "medium" | "high" | "very_high"
  # low: < 1,000 THB/mo, medium: 1,000-3,000, high: 3,000-8,000, very_high: > 8,000

# ---- Responsible Fit: Time ----
time:
  daily_active_minutes: [number, number]  # exercise/play time needed per day
  daily_attention_hours: number           # rough hours of companionship needed
  alone_tolerance_hours: number           # max hours can be left alone
  time_tier: "low" | "medium" | "high"
  # low: < 30 min active, medium: 30-90 min, high: > 90 min

# ---- Responsible Fit: Space ----
space:
  minimum_sq_meters: number          # minimum living space
  space_tier: "apartment" | "house" | "large_house_outdoor"
  outdoor_required: boolean          # needs yard/outdoor access?
  indoor_only_ok: boolean            # can live entirely indoors?
  cage_or_enclosure_ok: boolean      # suitable for cage/enclosure living?

# ---- Responsible Fit: Allergies ----
allergies:
  allergen_level: "none" | "low" | "medium" | "high"
  hypoallergenic: boolean  # commonly considered hypoallergenic?
  notes: string            # detail on shedding, dander, etc.

# ---- Responsible Fit: Noise ----
noise:
  noise_level: "silent" | "quiet" | "moderate" | "vocal" | "very_vocal"
  barking_or_meowing: boolean       # prone to vocalization?
  nocturnal_noise_risk: boolean     # active at night?
  suitable_for_apartment: boolean

# ---- Responsible Fit: Legality & Restrictions ----
legality:
  restricted_in_thailand: boolean
  restricted_regions: [string]      # list of regions/countries with bans/restrictions
  requires_permit: boolean
  cites_protected: boolean          # CITES listed?
  notes: string

# ---- Responsible Fit: Existing Pets ----
existing_pets:
  dog_friendly: boolean
  cat_friendly: boolean
  small_pet_safe: boolean           # safe around rabbits, birds, fish?
  notes: string                     # breed-specific compatibility notes

# ---- Responsible Fit: Travel ----
travel:
  travel_friendly: boolean          # easy to travel with?
  boarding_difficulty: "easy" | "moderate" | "hard"
  transport_notes: string

# ---- Responsible Fit: Experience ----
experience:
  experience_level: "beginner" | "intermediate" | "experienced"
  notes: string                     # what makes this pet challenging for new owners

# ---- Care Expectations ----
care:
  grooming_frequency: string        # e.g. "weekly", "daily", "monthly"
  grooming_complexity: "low" | "medium" | "high"
  feeding_frequency_per_day: number
  special_diet_needs: boolean
  exercise_type: string             # e.g. "walks", "free play", "swimming", "flying time"
  common_health_issues: [string]
  vet_visit_frequency: string       # e.g. "annual", "bi-annual"

# ---- Concerns & Dealbreakers ----
concerns:
  - id: string                      # unique slug for this concern
    title: string                   # e.g. "Heavy shedding"
    severity: "minor" | "moderate" | "major"
    description: string             # detail for agents and Concern Checklist
  # ... 2-5 concerns per profile

# ---- Matching Traits (scoring signals) ----
matching:
  # These are scored during matching. Each trait maps to quiz/lifestyle dimensions.
  trait_scores:
    budget_match: number       # 1-10 how budget-flexible
    time_match: number         # 1-10 how time-flexible
    space_match: number        # 1-10 space flexibility
    allergy_match: number     # 1-10 hypoallergenic score
    noise_match: number        # 1-10 quietness score
    travel_match: number       # 1-10 travel compatibility
    existing_pets_match: number # 1-10 multi-pet compatibility
    beginner_match: number     # 1-10 how beginner-friendly
    child_friendly: number     # 1-10 kid compatibility

# ---- Agent Guidance (long-form text for Decision Agent context) ----
agent_guidance:
  who_is_this_pet_for: string       # description of ideal owner profile
  hidden_costs: string              # costs new owners often miss
  common_mistakes: string           # mistakes new owners make
  adoption_advice: string           # tips for adoption/breeder selection
  decision_factors: string          # key things to consider before committing

# ---- Metadata ----
meta:
  version: string                   # semver for this profile
  last_updated: string              # ISO date
  sources: [string]                 # references/attributions
