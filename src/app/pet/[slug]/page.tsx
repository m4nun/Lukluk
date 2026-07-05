import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { getPetLogo } from "@/lib/pet-logos";
import { ArrowLeft, Clock, Home, PiggyBank, AlertTriangle, PawPrint } from "lucide-react";

const BUDGET_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

const SPACE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  large_house_outdoor: "Large House + Outdoor",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner-friendly",
  intermediate: "Intermediate",
  experienced: "Experienced",
};

const CONCERN_SEVERITY_COLORS: Record<string, string> = {
  minor: "bg-warning/10 text-warning-foreground border-warning/20",
  moderate: "bg-destructive/10 text-destructive border-destructive/20",
  major: "bg-destructive/20 text-destructive border-destructive/40",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed_or_category: string;
  description: string;
  mbti_label: string;
  mbti_traits: string[];
  mbti_description: string;
  size: string;
  weight_min_kg: number;
  weight_max_kg: number;
  lifespan_min_yrs: number;
  lifespan_max_yrs: number;
  coat_type: string;
  initial_cost_min_thb: number;
  initial_cost_max_thb: number;
  monthly_cost_min_thb: number;
  monthly_cost_max_thb: number;
  annual_medical_min_thb: number;
  annual_medical_max_thb: number;
  budget_tier: string;
  daily_active_minutes_min: number;
  daily_active_minutes_max: number;
  daily_attention_hours: number;
  alone_tolerance_hours: number;
  time_tier: string;
  minimum_sq_meters: number;
  space_tier: string;
  outdoor_required: boolean;
  indoor_only_ok: boolean;
  allergen_level: string;
  hypoallergenic: boolean;
  allergy_notes: string | null;
  noise_level: string;
  suitable_for_apartment: boolean;
  restricted_in_thailand: boolean;
  requires_permit: boolean;
  dog_friendly: boolean;
  cat_friendly: boolean;
  small_pet_safe: boolean;
  travel_friendly: boolean;
  boarding_difficulty: string;
  experience_level: string;
  grooming_frequency: string;
  grooming_complexity: string;
  feeding_per_day: number;
  exercise_type: string;
  common_health_issues: string[];
  vet_visit_frequency: string;
  concerns: Array<{
    id: string;
    title: string;
    severity: "minor" | "moderate" | "major";
    description: string;
  }>;
  who_this_pet_for: string | null;
  hidden_costs: string | null;
  common_mistakes: string | null;
  adoption_advice: string | null;
  decision_factors: string | null;
  experiences: Array<{
    id: string;
    title: string;
    body: string;
    ownership_duration: string | null;
    created_at: string;
    has_owned: boolean;
  }>;
}

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("pet_type_profiles")
    .select("*")
    .eq("id", slug)
    .single();

  if (!pet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Pet not found</h1>
        <Link href="/" className="mt-4 text-primary hover:underline">
          Back to Lukluk
        </Link>
      </div>
    );
  }

  const { data: experiences } = await supabase
    .from("owner_experiences")
    .select("id, title, body, ownership_duration, created_at, has_owned")
    .eq("pet_type_profile_id", slug)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
    .limit(20);

  const profile = { ...pet, experiences: experiences || [] } as PetProfile;
  const logoSrc = getPetLogo(slug);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Image src="/assets/logo.png" alt="Lukluk" width={28} height={28} />
            Lukluk
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[960px] flex-1 px-6 pb-16">
        {/* Hero */}
        <div className="flex items-start gap-6 pt-12">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-primary/5">
            {logoSrc ? (
              <Image src={logoSrc} alt={profile.name} width={80} height={80} className="object-cover" />
            ) : (
              <PawPrint className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {profile.species}
              </span>
              {profile.hypoallergenic && (
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  Hypoallergenic
                </span>
              )}
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {profile.description}
            </p>
          </div>
        </div>

        {/* MBTI */}
        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Pet MBTI
          </h2>
          <p className="text-xl font-bold">{profile.mbti_label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{profile.mbti_description}</p>
        </div>

        {/* Quick stats grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Budget Tier", value: BUDGET_LABELS[profile.budget_tier] || profile.budget_tier, icon: <PiggyBank className="h-4 w-4" /> },
            { label: "Time Required", value: `${profile.daily_active_minutes_min}-${profile.daily_active_minutes_max} min/day`, icon: <Clock className="h-4 w-4" /> },
            { label: "Space", value: SPACE_LABELS[profile.space_tier] || profile.space_tier, icon: <Home className="h-4 w-4" /> },
            { label: "Experience", value: EXPERIENCE_LABELS[profile.experience_level] || profile.experience_level, icon: "📚" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {typeof s.icon === "string" ? <span className="text-lg">{s.icon}</span> : s.icon}
                <span className="text-[11px] font-semibold uppercase tracking-widest">{s.label}</span>
              </div>
              <p className="text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Details grid */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Budget */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
              <PiggyBank className="h-4 w-4 text-primary" />
              Cost Breakdown
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Initial Cost</span>
                <span className="font-semibold tabular-nums">
                  {profile.initial_cost_min_thb.toLocaleString()} – {profile.initial_cost_max_thb.toLocaleString()} THB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Cost</span>
                <span className="font-semibold tabular-nums">
                  {profile.monthly_cost_min_thb.toLocaleString()} – {profile.monthly_cost_max_thb.toLocaleString()} THB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annual Medical</span>
                <span className="font-semibold tabular-nums">
                  {profile.annual_medical_min_thb.toLocaleString()} – {profile.annual_medical_max_thb.toLocaleString()} THB
                </span>
              </div>
            </div>
          </div>

          {/* Care */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
              <Clock className="h-4 w-4 text-primary" />
              Care Schedule
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exercise</span>
                <span className="font-semibold">{profile.exercise_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grooming</span>
                <span className="font-semibold">{profile.grooming_frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Feeding</span>
                <span className="font-semibold">{profile.feeding_per_day}x / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vet Visits</span>
                <span className="font-semibold">{profile.vet_visit_frequency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compatibility */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold mb-4">Compatibility</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Dog-friendly", ok: profile.dog_friendly },
              { label: "Cat-friendly", ok: profile.cat_friendly },
              { label: "Small pet safe", ok: profile.small_pet_safe },
              { label: "Apartment", ok: profile.suitable_for_apartment },
              { label: "Travel-friendly", ok: profile.travel_friendly },
              { label: "Indoor only", ok: profile.indoor_only_ok },
              { label: "Hypoallergenic", ok: profile.hypoallergenic },
              { label: "No permit needed", ok: !profile.requires_permit },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-sm">
                <span className={c.ok ? "text-success" : "text-muted-foreground"}>
                  {c.ok ? "✓" : "✗"}
                </span>
                <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Concerns */}
        {profile.concerns && profile.concerns.length > 0 && (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Concerns to consider
            </h2>
            <div className="space-y-3">
              {(Array.isArray(profile.concerns) ? profile.concerns : []).map((c, i) => (
                <div
                  key={c.id || i}
                  className={`rounded-xl border p-5 ${CONCERN_SEVERITY_COLORS[c.severity] || "bg-muted/30 border-border"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm">{c.title}</h3>
                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guidance */}
        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold mb-4">Decision Guidance</h2>
          <div className="space-y-4 text-sm">
            {profile.who_this_pet_for && (
              <div>
                <h4 className="font-semibold text-primary mb-1">Who this pet is for</h4>
                <p className="text-muted-foreground">{profile.who_this_pet_for}</p>
              </div>
            )}
            {profile.hidden_costs && (
              <div>
                <h4 className="font-semibold text-warning-foreground mb-1">Hidden Costs</h4>
                <p className="text-muted-foreground">{profile.hidden_costs}</p>
              </div>
            )}
            {profile.common_mistakes && (
              <div>
                <h4 className="font-semibold text-destructive mb-1">Common Mistakes</h4>
                <p className="text-muted-foreground">{profile.common_mistakes}</p>
              </div>
            )}
            {profile.adoption_advice && (
              <div>
                <h4 className="font-semibold text-success mb-1">Adoption Advice</h4>
                <p className="text-muted-foreground">{profile.adoption_advice}</p>
              </div>
            )}
            {profile.decision_factors && (
              <div>
                <h4 className="font-semibold mb-1">Decision Factors</h4>
                <p className="text-muted-foreground">{profile.decision_factors}</p>
              </div>
            )}
          </div>
        </div>

        {/* Owner Experiences */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-2">Owner Experiences</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Anecdotal experiences from self-declared owners — not expert advice.
          </p>

          {profile.experiences.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No experiences shared yet for {profile.name}.
              </p>
              <Link
                href="/experiences"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Share your experience →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold">{exp.title}</h3>
                    {exp.ownership_duration && (
                      <span className="shrink-0 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        {exp.ownership_duration}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{exp.body}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {timeAgo(exp.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-[960px] flex items-center justify-between px-6">
          <p>© 2026 Lukluk. All rights reserved.</p>
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
