-- ============================================================
-- Lukluk v1 — Supabase Database Schema (Idempotent)
-- Safe to run multiple times. Tables/indexes/policies created
-- only if they don't already exist.
-- ============================================================

-- ============================================================
-- 1. User Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Pet Type Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pet_type_profiles (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  species         TEXT NOT NULL,
  breed_or_category TEXT NOT NULL,
  description     TEXT NOT NULL,
  mbti_label      TEXT NOT NULL,
  mbti_traits     JSONB NOT NULL DEFAULT '[]',
  mbti_description TEXT NOT NULL,

  size              TEXT NOT NULL,
  weight_min_kg     REAL NOT NULL,
  weight_max_kg     REAL NOT NULL,
  lifespan_min_yrs  INTEGER NOT NULL,
  lifespan_max_yrs  INTEGER NOT NULL,
  coat_type         TEXT NOT NULL,

  initial_cost_min_thb   INTEGER NOT NULL,
  initial_cost_max_thb   INTEGER NOT NULL,
  monthly_cost_min_thb   INTEGER NOT NULL,
  monthly_cost_max_thb   INTEGER NOT NULL,
  annual_medical_min_thb INTEGER NOT NULL,
  annual_medical_max_thb INTEGER NOT NULL,
  budget_tier            TEXT NOT NULL,

  daily_active_minutes_min INTEGER NOT NULL,
  daily_active_minutes_max INTEGER NOT NULL,
  daily_attention_hours    REAL NOT NULL,
  alone_tolerance_hours    REAL NOT NULL,
  time_tier                TEXT NOT NULL,

  minimum_sq_meters         REAL NOT NULL,
  space_tier                TEXT NOT NULL,
  outdoor_required          BOOLEAN NOT NULL DEFAULT false,
  indoor_only_ok            BOOLEAN NOT NULL DEFAULT false,
  cage_or_enclosure_ok      BOOLEAN NOT NULL DEFAULT false,

  allergen_level  TEXT NOT NULL,
  hypoallergenic  BOOLEAN NOT NULL DEFAULT false,
  allergy_notes   TEXT,

  noise_level             TEXT NOT NULL,
  barking_or_meowing      BOOLEAN NOT NULL DEFAULT false,
  nocturnal_noise_risk    BOOLEAN NOT NULL DEFAULT false,
  suitable_for_apartment  BOOLEAN NOT NULL DEFAULT true,

  restricted_in_thailand  BOOLEAN NOT NULL DEFAULT false,
  restricted_regions       JSONB NOT NULL DEFAULT '[]',
  requires_permit          BOOLEAN NOT NULL DEFAULT false,
  cites_protected          BOOLEAN NOT NULL DEFAULT false,
  legality_notes           TEXT,

  dog_friendly      BOOLEAN NOT NULL DEFAULT true,
  cat_friendly      BOOLEAN NOT NULL DEFAULT true,
  small_pet_safe    BOOLEAN NOT NULL DEFAULT true,
  pet_compat_notes  TEXT,

  travel_friendly    BOOLEAN NOT NULL DEFAULT true,
  boarding_difficulty TEXT NOT NULL,
  transport_notes    TEXT,

  experience_level     TEXT NOT NULL,
  experience_notes     TEXT,

  grooming_frequency     TEXT NOT NULL,
  grooming_complexity    TEXT NOT NULL,
  feeding_per_day        INTEGER NOT NULL,
  special_diet_needs     BOOLEAN NOT NULL DEFAULT false,
  exercise_type          TEXT NOT NULL,
  common_health_issues   JSONB NOT NULL DEFAULT '[]',
  vet_visit_frequency    TEXT NOT NULL,

  concerns              JSONB NOT NULL DEFAULT '[]',

  budget_match_score          SMALLINT NOT NULL CHECK (budget_match_score BETWEEN 1 AND 10),
  time_match_score            SMALLINT NOT NULL CHECK (time_match_score BETWEEN 1 AND 10),
  space_match_score           SMALLINT NOT NULL CHECK (space_match_score BETWEEN 1 AND 10),
  allergy_match_score         SMALLINT NOT NULL CHECK (allergy_match_score BETWEEN 1 AND 10),
  noise_match_score           SMALLINT NOT NULL CHECK (noise_match_score BETWEEN 1 AND 10),
  travel_match_score          SMALLINT NOT NULL CHECK (travel_match_score BETWEEN 1 AND 10),
  existing_pets_match_score   SMALLINT NOT NULL CHECK (existing_pets_match_score BETWEEN 1 AND 10),
  beginner_match_score        SMALLINT NOT NULL CHECK (beginner_match_score BETWEEN 1 AND 10),
  child_friendly_score        SMALLINT NOT NULL CHECK (child_friendly_score BETWEEN 1 AND 10),

  who_this_pet_for      TEXT,
  hidden_costs          TEXT,
  common_mistakes       TEXT,
  adoption_advice       TEXT,
  decision_factors      TEXT,

  version       TEXT NOT NULL DEFAULT '1.0.0',
  last_updated  TIMESTAMPTZ NOT NULL DEFAULT now(),
  sources       JSONB NOT NULL DEFAULT '[]',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Lifestyle Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lifestyle_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_answers    JSONB NOT NULL DEFAULT '{}',
  follow_ups      JSONB NOT NULL DEFAULT '[]',
  is_latest       BOOLEAN NOT NULL DEFAULT true,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Match Results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.match_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lifestyle_profile_id UUID NOT NULL REFERENCES public.lifestyle_profiles(id) ON DELETE CASCADE,
  top_matches         JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Planning Pet Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.planning_pet_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_type_profile_id  TEXT NOT NULL REFERENCES public.pet_type_profiles(id) ON DELETE RESTRICT,
  match_result_id      UUID REFERENCES public.match_results(id) ON DELETE SET NULL,
  planning_name       TEXT,
  decision_status     TEXT NOT NULL DEFAULT 'exploring',
  estimated_expenses  JSONB NOT NULL DEFAULT '[]',
  concern_checklist   JSONB NOT NULL DEFAULT '[]',
  has_ownership        BOOLEAN NOT NULL DEFAULT false,
  owned_pet_profile_id  UUID,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. Owned Pet Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owned_pet_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  planning_pet_profile_id UUID NOT NULL REFERENCES public.planning_pet_profiles(id) ON DELETE RESTRICT,
  pet_type_profile_id  TEXT NOT NULL REFERENCES public.pet_type_profiles(id) ON DELETE RESTRICT,
  pet_name            TEXT NOT NULL,
  age_life_stage      TEXT NOT NULL,
  got_date            DATE,
  got_date_unknown    BOOLEAN NOT NULL DEFAULT false,
  weight_kg           REAL,
  sex                 TEXT,
  current_food        TEXT,
  health_concerns     JSONB NOT NULL DEFAULT '[]',
  is_neutered_spayed  BOOLEAN,
  other_pets          JSONB NOT NULL DEFAULT '[]',
  vet_notes           TEXT,
  actual_expenses     JSONB NOT NULL DEFAULT '[]',
  activity_schedule   JSONB NOT NULL DEFAULT '[]',
  food_guide          JSONB NOT NULL DEFAULT '{}',
  schedule            JSONB NOT NULL DEFAULT '[]',
  health_metrics      JSONB NOT NULL DEFAULT '[]',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. Agent Drafts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_drafts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_pet_profile_id UUID NOT NULL REFERENCES public.planning_pet_profiles(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target              TEXT NOT NULL,
  field_path          TEXT,
  current_value       JSONB,
  proposed_value      JSONB NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. Agent Threads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_threads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_pet_profile_id UUID REFERENCES public.planning_pet_profiles(id) ON DELETE CASCADE,
  thread_id             TEXT NOT NULL UNIQUE,
  owned_pet_profile_id  UUID REFERENCES public.owned_pet_profiles(id) ON DELETE CASCADE,
  agent_type            TEXT NOT NULL DEFAULT 'decision',
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. Owner Experiences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_experiences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_type_profile_id  TEXT NOT NULL REFERENCES public.pet_type_profiles(id) ON DELETE CASCADE,
  has_owned            BOOLEAN NOT NULL,
  ownership_duration   TEXT,
  pet_name_or_number   TEXT,
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  is_flagged           BOOLEAN NOT NULL DEFAULT false,
  flag_reason          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. Subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id     TEXT,
  status              TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. Estimated Expenses (normalized)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.estimated_expenses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_pet_profile_id UUID NOT NULL REFERENCES public.planning_pet_profiles(id) ON DELETE CASCADE,
  category              TEXT NOT NULL,
  item                  TEXT NOT NULL,
  amount_thb            INTEGER NOT NULL DEFAULT 0,
  note                  TEXT,
  sort_order            SMALLINT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. Concern Checklist Items (normalized)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.concern_checklist_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_pet_profile_id UUID NOT NULL REFERENCES public.planning_pet_profiles(id) ON DELETE CASCADE,
  concern_id            TEXT NOT NULL,
  title                 TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'unresolved',
  note                  TEXT,
  sort_order            SMALLINT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES (IF NOT EXISTS)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_pet_type_profiles_species ON public.pet_type_profiles(species);
CREATE INDEX IF NOT EXISTS idx_pet_type_profiles_budget_tier ON public.pet_type_profiles(budget_tier);
CREATE INDEX IF NOT EXISTS idx_pet_type_profiles_experience_level ON public.pet_type_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_lifestyle_profiles_user_id ON public.lifestyle_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_lifestyle_profiles_is_latest ON public.lifestyle_profiles(user_id, is_latest);
CREATE INDEX IF NOT EXISTS idx_match_results_user_id ON public.match_results(user_id);
CREATE INDEX IF NOT EXISTS idx_match_results_lifestyle ON public.match_results(lifestyle_profile_id);
CREATE INDEX IF NOT EXISTS idx_planning_pet_profiles_user ON public.planning_pet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_pet_profiles_type ON public.planning_pet_profiles(pet_type_profile_id);
CREATE INDEX IF NOT EXISTS idx_owned_pet_profiles_user ON public.owned_pet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_drafts_profile ON public.agent_drafts(planning_pet_profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_drafts_status ON public.agent_drafts(planning_pet_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_threads_planning ON public.agent_threads(planning_pet_profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_threads_owned ON public.agent_threads(owned_pet_profile_id);
CREATE INDEX IF NOT EXISTS idx_owner_experiences_pet ON public.owner_experiences(pet_type_profile_id);
CREATE INDEX IF NOT EXISTS idx_owner_experiences_user ON public.owner_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_estimated_expenses_profile ON public.estimated_expenses(planning_pet_profile_id);
CREATE INDEX IF NOT EXISTS idx_concern_checklist_profile ON public.concern_checklist_items(planning_pet_profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_type_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_pet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owned_pet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimated_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concern_checklist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent), then recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
  DROP POLICY IF EXISTS "pet_profiles_select" ON public.pet_type_profiles;
  DROP POLICY IF EXISTS "lifestyle_select_own" ON public.lifestyle_profiles;
  DROP POLICY IF EXISTS "lifestyle_insert_own" ON public.lifestyle_profiles;
  DROP POLICY IF EXISTS "match_results_select_own" ON public.match_results;
  DROP POLICY IF EXISTS "planning_select_own" ON public.planning_pet_profiles;
  DROP POLICY IF EXISTS "planning_insert_own" ON public.planning_pet_profiles;
  DROP POLICY IF EXISTS "planning_update_own" ON public.planning_pet_profiles;
  DROP POLICY IF EXISTS "planning_delete_own" ON public.planning_pet_profiles;
  DROP POLICY IF EXISTS "owned_select_own" ON public.owned_pet_profiles;
  DROP POLICY IF EXISTS "owned_insert_own" ON public.owned_pet_profiles;
  DROP POLICY IF EXISTS "owned_update_own" ON public.owned_pet_profiles;
  DROP POLICY IF EXISTS "drafts_select_own" ON public.agent_drafts;
  DROP POLICY IF EXISTS "drafts_insert_own" ON public.agent_drafts;
  DROP POLICY IF EXISTS "drafts_update_own" ON public.agent_drafts;
  DROP POLICY IF EXISTS "threads_select_own" ON public.agent_threads;
  DROP POLICY IF EXISTS "threads_insert_own" ON public.agent_threads;
  DROP POLICY IF EXISTS "threads_update_own" ON public.agent_threads;
  DROP POLICY IF EXISTS "experiences_select" ON public.owner_experiences;
  DROP POLICY IF EXISTS "experiences_insert_subscriber" ON public.owner_experiences;
  DROP POLICY IF EXISTS "experiences_update_own" ON public.owner_experiences;
  DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
  DROP POLICY IF EXISTS "expenses_select_own" ON public.estimated_expenses;
  DROP POLICY IF EXISTS "expenses_insert_own" ON public.estimated_expenses;
  DROP POLICY IF EXISTS "expenses_update_own" ON public.estimated_expenses;
  DROP POLICY IF EXISTS "expenses_delete_own" ON public.estimated_expenses;
  DROP POLICY IF EXISTS "concerns_select_own" ON public.concern_checklist_items;
  DROP POLICY IF EXISTS "concerns_insert_own" ON public.concern_checklist_items;
  DROP POLICY IF EXISTS "concerns_update_own" ON public.concern_checklist_items;
  DROP POLICY IF EXISTS "concerns_delete_own" ON public.concern_checklist_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Profiles: users read any, update own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Pet Type Profiles: everyone reads, service_role writes
CREATE POLICY "pet_profiles_select" ON public.pet_type_profiles FOR SELECT USING (true);

-- Lifestyle Profiles: users read/write own
CREATE POLICY "lifestyle_select_own" ON public.lifestyle_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lifestyle_insert_own" ON public.lifestyle_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Match Results: users read own
CREATE POLICY "match_results_select_own" ON public.match_results FOR SELECT USING (auth.uid() = user_id);

-- Planning Pet Profiles: users CRUD own
CREATE POLICY "planning_select_own" ON public.planning_pet_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "planning_insert_own" ON public.planning_pet_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "planning_update_own" ON public.planning_pet_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "planning_delete_own" ON public.planning_pet_profiles FOR DELETE USING (auth.uid() = user_id);

-- Owned Pet Profiles: users CRUD own
CREATE POLICY "owned_select_own" ON public.owned_pet_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owned_insert_own" ON public.owned_pet_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owned_update_own" ON public.owned_pet_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Agent Drafts: users CRUD own (through their planning profiles)
CREATE POLICY "drafts_select_own" ON public.agent_drafts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid()));
CREATE POLICY "drafts_insert_own" ON public.agent_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "drafts_update_own" ON public.agent_drafts FOR UPDATE
  USING (auth.uid() = user_id);

-- Agent Threads: users read/write own
CREATE POLICY "threads_select_own" ON public.agent_threads FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.owned_pet_profiles o WHERE o.id = owned_pet_profile_id AND o.user_id = auth.uid())
  );
CREATE POLICY "threads_insert_own" ON public.agent_threads FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.owned_pet_profiles o WHERE o.id = owned_pet_profile_id AND o.user_id = auth.uid())
  );
CREATE POLICY "threads_update_own" ON public.agent_threads FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.owned_pet_profiles o WHERE o.id = owned_pet_profile_id AND o.user_id = auth.uid())
  );

-- Owner Experiences: everyone reads, subscribers insert, author updates
CREATE POLICY "experiences_select" ON public.owner_experiences FOR SELECT USING (true);
CREATE POLICY "experiences_insert_subscriber" ON public.owner_experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = auth.uid() AND s.status = 'active'));
CREATE POLICY "experiences_update_own" ON public.owner_experiences FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions: users read own
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Estimated Expenses: users CRUD own through planning profile
CREATE POLICY "expenses_select_own" ON public.estimated_expenses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid()));
CREATE POLICY "expenses_insert_own" ON public.estimated_expenses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid()));
CREATE POLICY "expenses_update_own" ON public.estimated_expenses FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid()));
CREATE POLICY "expenses_delete_own" ON public.estimated_expenses FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid()));

-- Concern Checklist: users CRUD own through planning profile
CREATE POLICY "concerns_select_own" ON public.concern_checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid()));
CREATE POLICY "concerns_insert_own" ON public.concern_checklist_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid()));
CREATE POLICY "concerns_update_own" ON public.concern_checklist_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid()));
CREATE POLICY "concerns_delete_own" ON public.concern_checklist_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.planning_pet_profiles p WHERE p.id = planning_pet_profile_id AND p.user_id = auth.uid()));

-- ============================================================
-- TRIGGERS (drop + recreate for idempotency)
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-set is_latest = false on new lifestyle profile
CREATE OR REPLACE FUNCTION public.set_latest_lifestyle_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.lifestyle_profiles
  SET is_latest = false
  WHERE user_id = NEW.user_id AND id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lifestyle_profile_created ON public.lifestyle_profiles;
CREATE TRIGGER on_lifestyle_profile_created
  BEFORE INSERT ON public.lifestyle_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_latest_lifestyle_profile();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_planning_updated_at ON public.planning_pet_profiles;
CREATE TRIGGER trg_planning_updated_at
  BEFORE UPDATE ON public.planning_pet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_owned_updated_at ON public.owned_pet_profiles;
CREATE TRIGGER trg_owned_updated_at
  BEFORE UPDATE ON public.owned_pet_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_drafts_updated_at ON public.agent_drafts;
CREATE TRIGGER trg_drafts_updated_at
  BEFORE UPDATE ON public.agent_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_threads_updated_at ON public.agent_threads;
CREATE TRIGGER trg_threads_updated_at
  BEFORE UPDATE ON public.agent_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.estimated_expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.estimated_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_concerns_updated_at ON public.concern_checklist_items;
CREATE TRIGGER trg_concerns_updated_at
  BEFORE UPDATE ON public.concern_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ALTER TABLE: Ensure new columns exist (safe for existing tables)
-- ============================================================

-- Schedule and Health columns for owned_pet_profiles
DO $$ BEGIN
  ALTER TABLE public.owned_pet_profiles ADD COLUMN IF NOT EXISTS schedule JSONB NOT NULL DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.owned_pet_profiles ADD COLUMN IF NOT EXISTS health_metrics JSONB NOT NULL DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.owned_pet_profiles ADD COLUMN IF NOT EXISTS activity_schedule JSONB NOT NULL DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.owned_pet_profiles ADD COLUMN IF NOT EXISTS food_guide JSONB NOT NULL DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.owned_pet_profiles ADD COLUMN IF NOT EXISTS actual_expenses JSONB NOT NULL DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.owned_pet_profiles ADD COLUMN IF NOT EXISTS health_concerns JSONB NOT NULL DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.owned_pet_profiles ADD COLUMN IF NOT EXISTS other_pets JSONB NOT NULL DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
