import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { getPetLogo } from "@/lib/pet-logos";
import {
  ArrowLeft,
  PawPrint,
  CheckCircle,
  Coins,
  Home,
  Clock,
  GraduationCap,
  Group,
  Brain,
  Heart,
} from "lucide-react";

const MBTI_WORDS: Record<string, string> = {
  I: "Introverted",
  N: "Intuitive",
  F: "Feeling",
  J: "Judging",
  E: "Extraverted",
  S: "Sensing",
  T: "Thinking",
  P: "Perceiving",
};

const MBTI_DESCRIPTIONS: Record<string, string> = {
  INFJ: "The Advocate",
  INTJ: "The Architect",
  INFP: "The Mediator",
  INTP: "The Logician",
  ISFJ: "The Defender",
  ISTJ: "The Logistician",
  ISFP: "The Adventurer",
  ISTP: "The Virtuoso",
  ENFJ: "The Protagonist",
  ENTJ: "The Commander",
  ENFP: "The Campaigner",
  ENTP: "The Debater",
  ESFJ: "The Consul",
  ESTJ: "The Executive",
  ESFP: "The Entertainer",
  ESTP: "The Entrepreneur",
};

const TRAIT_COLORS = [
  "bg-purple-50 text-purple-600 border-purple-200",
  "bg-pink-50 text-pink-600 border-pink-200",
  "bg-cyan-50 text-cyan-600 border-cyan-200",
  "bg-lime-50 text-lime-600 border-lime-200",
  "bg-orange-50 text-orange-600 border-orange-200",
];

const DIMENSION_COLORS = ["bg-purple-500", "bg-cyan-500", "bg-pink-500", "bg-lime-500"];
const DIMENSION_CARD_COLORS = [
  "hover:border-purple-300 hover:shadow-purple-100",
  "hover:border-cyan-300 hover:shadow-cyan-100",
  "hover:border-pink-300 hover:shadow-pink-100",
  "hover:border-lime-300 hover:shadow-lime-100",
];

const CARE_CARD_COLORS = [
  { bg: "bg-purple-50", icon: "text-purple-500" },
  { bg: "bg-cyan-50", icon: "text-cyan-500" },
  { bg: "bg-pink-50", icon: "text-pink-500" },
  { bg: "bg-lime-50", icon: "text-lime-500" },
];

const COMPAT_BAR_COLORS = ["bg-purple-500", "bg-cyan-500", "bg-pink-500"];

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
  who_this_pet_for: string | null;
  hidden_costs: string | null;
  common_mistakes: string | null;
  adoption_advice: string | null;
  decision_factors: string | null;
}

function computeDimensions(pet: PetProfile) {
  const activeMid =
    ((pet.daily_active_minutes_min + pet.daily_active_minutes_max) / 2 / 180) * 100;
  const energyPct = Math.min(100, Math.max(10, Math.round(activeMid)));

  const indepPct = Math.min(100, Math.max(10, Math.round((pet.alone_tolerance_hours / 12) * 100)));

  const groomingMap: Record<string, number> = {
    low: 25,
    moderate: 50,
    high: 75,
    very_high: 95,
  };
  const groomPct = groomingMap[pet.grooming_frequency] ?? 50;

  const affectionPct = Math.min(
    100,
    Math.max(10, Math.round((pet.daily_attention_hours / 8) * 100))
  );

  return [
    {
      label: "Energy Level",
      value: energyPct,
      display: energyPct < 40 ? "Low" : energyPct < 70 ? "Medium" : "High",
    },
    {
      label: "Independence",
      value: indepPct,
      display: indepPct < 40 ? "Low" : indepPct < 70 ? "Medium" : "High",
    },
    {
      label: "Grooming Needs",
      value: groomPct,
      display:
        groomPct < 30
          ? "Low"
          : groomPct < 60
          ? "Moderate"
          : groomPct < 80
          ? "High"
          : "Very High",
    },
    {
      label: "Affection Level",
      value: affectionPct,
      display:
        affectionPct < 30
          ? "Aloof"
          : affectionPct < 60
          ? "Moderate"
          : affectionPct < 80
          ? "Affectionate"
          : "Very Affectionate",
    },
  ];
}

function computeCompatibility(current: PetProfile, others: PetProfile[]) {
  return others
    .filter((p) => p.id !== current.id)
    .map((p) => {
      let score = 50;
      if (p.species === current.species) score += 20;
      if (p.budget_tier === current.budget_tier) score += 10;
      if (p.time_tier === current.time_tier) score += 10;
      if (p.space_tier === current.space_tier) score += 5;
      if (p.experience_level === current.experience_level) score += 5;
      score = Math.min(98, score + Math.floor(Math.random() * 5));
      return { ...p, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

function petSubtitle(pet: PetProfile): string {
  const traitWords = pet.mbti_traits.slice(0, 4);
  if (traitWords.length >= 4) {
    return `The ${pet.breed_or_category} — ${traitWords.join(", ")}`;
  }
  return pet.description.slice(0, 100);
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

  const { data: allPets } = await supabase
    .from("pet_type_profiles")
    .select("id, name, species, breed_or_category, budget_tier, time_tier, space_tier, experience_level");

  const profile = pet as PetProfile;
  const logoSrc = getPetLogo(slug);
  const dimensions = computeDimensions(profile);
  const compatiblePets = allPets ? computeCompatibility(profile, allPets as PetProfile[]) : [];

  const mbtiLetters = profile.mbti_label.split("");
  const personalityWords = mbtiLetters.map(
    (letter) => MBTI_WORDS[letter] || letter
  );
  const mbtiTitle = MBTI_DESCRIPTIONS[profile.mbti_label] || profile.mbti_label;

  const careCards = [
    {
      icon: <Coins className="h-5 w-5" />,
      label: "Monthly Budget",
      value: `฿${profile.monthly_cost_min_thb.toLocaleString()} - ${profile.monthly_cost_max_thb.toLocaleString()}`,
      desc: `Initial cost: ฿${profile.initial_cost_min_thb.toLocaleString()} - ${profile.initial_cost_max_thb.toLocaleString()} THB`,
    },
    {
      icon: <Home className="h-5 w-5" />,
      label: "Space Needed",
      value:
        profile.space_tier === "apartment"
          ? "Apartment OK"
          : profile.space_tier === "house"
          ? "House Recommended"
          : "Large Space Needed",
      desc: `Minimum ${profile.minimum_sq_meters} sq meters. ${profile.indoor_only_ok ? "Indoor only OK." : "Outdoor access recommended."}`,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Time Commitment",
      value: `${profile.daily_active_minutes_min}-${profile.daily_active_minutes_max} min/day`,
      desc: `${profile.feeding_per_day}x feeding daily. ${profile.grooming_frequency} grooming needed.`,
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      label: "Experience Level",
      value:
        profile.experience_level === "beginner"
          ? "Beginner-friendly"
          : profile.experience_level === "intermediate"
          ? "Intermediate"
          : "Experienced Owners",
      desc: `${profile.exercise_type} exercise. ${profile.vet_visit_frequency} vet visits.`,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes barFill { from { width: 0; } }
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both; }
        .animate-fade-in { animation: fadeIn 0.6s ease-out both; }
        .animate-scale-in { animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) both; }
        .animate-bar { animation: barFill 0.8s cubic-bezier(0.4, 0, 0.2, 1) both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.15s; }
        .delay-3 { animation-delay: 0.2s; }
        .delay-4 { animation-delay: 0.25s; }
        .delay-5 { animation-delay: 0.3s; }
        .delay-6 { animation-delay: 0.35s; }
        .delay-7 { animation-delay: 0.4s; }
        .delay-8 { animation-delay: 0.45s; }
        .delay-9 { animation-delay: 0.5s; }
        .delay-10 { animation-delay: 0.55s; }
        .delay-11 { animation-delay: 0.6s; }
        .delay-12 { animation-delay: 0.65s; }
        .delay-13 { animation-delay: 0.7s; }
        .delay-14 { animation-delay: 0.75s; }
        .delay-15 { animation-delay: 0.8s; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-[#fafafa]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[900px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
            <Image src="/assets/logo.png" alt="Lukluk" width={28} height={28} />
            Lukluk
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[900px] flex-1 px-6 pb-16">
        {/* Hero Section */}
        <section className="flex items-start gap-10 pt-12 animate-slide-up max-md:flex-col max-md:items-center max-md:text-center">
          <div className="relative h-[240px] w-[240px] flex-shrink-0 overflow-hidden rounded-[20px] bg-purple-50 shadow-lg max-md:h-[200px] max-md:w-[200px]">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="240px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <PawPrint className="h-16 w-16 text-gray-300" />
              </div>
            )}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-purple-500 px-4 py-2 text-sm font-bold text-white shadow-md" style={{ fontFamily: "var(--font-display)" }}>
              <PawPrint className="h-4 w-4" fill="white" />
              {profile.species}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1
              className="mb-2 text-4xl font-bold tracking-tight text-gray-900 max-md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {profile.name}
            </h1>
            <p className="mb-6 text-base text-gray-500">
              {petSubtitle(profile)}
            </p>

            {/* Personality Type Badge */}
            <div className="mb-6 inline-flex items-center gap-4 rounded-[20px] bg-purple-500 px-6 py-4 shadow-md animate-scale-in delay-1">
              <span
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {profile.mbti_label}
              </span>
              <div className="text-sm leading-snug text-white/90">
                <strong className="block font-bold text-white">
                  {mbtiTitle} — {personalityWords.join(" · ")}
                </strong>
                Personality archetype based on 8 lifestyle dimensions
              </div>
            </div>
          </div>
        </section>

        {/* Personality Dimensions */}
        <section className="mt-8 grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {dimensions.map((dim, i) => (
            <div
              key={dim.label}
              className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${DIMENSION_CARD_COLORS[i]} animate-slide-up`}
              style={{ animationDelay: `${0.15 + i * 0.05}s` }}
            >
              <div className="absolute top-0 left-0 h-full w-1 rounded-l-2xl" style={{ backgroundColor: ["#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"][i] }} />
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {dim.label}
                </span>
                <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: ["#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"][i] }}>
                  {dim.display}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full animate-bar ${DIMENSION_COLORS[i]}`}
                  style={{ width: `${dim.value}%`, animationDelay: `${0.3 + i * 0.1}s` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-gray-400">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          ))}
        </section>

        {/* Personality Traits */}
        <section className="mt-8 animate-slide-up delay-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <Brain className="h-5 w-5 text-orange-500" />
            Personality Traits
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {profile.mbti_traits.map((trait, i) => (
              <span
                key={trait}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${TRAIT_COLORS[i % TRAIT_COLORS.length]}`}
                style={{ animationDelay: `${0.35 + i * 0.05}s` }}
              >
                <CheckCircle className="h-4 w-4" />
                {trait}
              </span>
            ))}
          </div>
        </section>

        {/* Care Requirements */}
        <section className="mt-8 animate-slide-up delay-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <Heart className="h-5 w-5 text-orange-500" />
            Care Requirements
          </h2>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {careCards.map((card, i) => (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-orange-300 hover:shadow-md animate-slide-up"
                style={{ animationDelay: `${0.6 + i * 0.05}s` }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CARE_CARD_COLORS[i].bg}`}>
                    <span className={CARE_CARD_COLORS[i].icon}>{card.icon}</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      {card.label}
                    </div>
                    <div className="text-base font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                      {card.value}
                    </div>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-gray-400">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Compatible Breeds */}
        {compatiblePets.length > 0 && (
          <section className="mt-8 animate-slide-up delay-12">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
              <Group className="h-5 w-5 text-orange-500" />
              Compatible Breeds
            </h2>
            <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
              {compatiblePets.map((cp, i) => {
                const cpLogo = getPetLogo(cp.id);
                return (
                  <Link
                    key={cp.id}
                    href={`/pet/${cp.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md animate-slide-up"
                    style={{ animationDelay: `${0.8 + i * 0.05}s` }}
                  >
                    <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: ["#8b5cf6", "#06b6d4", "#ec4899"][i] }} />
                    <div className="mx-auto mb-3 flex h-16 w-16 overflow-hidden rounded-xl bg-purple-50">
                      {cpLogo ? (
                        <Image
                          src={cpLogo}
                          alt={cp.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <PawPrint className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="mb-1 text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>
                      {cp.name}
                    </div>
                    <span
                      className="inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-600"
                    >
                      {cp.matchScore}% Match
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-8 rounded-[20px] border border-purple-200 bg-purple-50 p-8 text-center animate-fade-in delay-15">
          <h2 className="mb-2 text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Ready to meet your {profile.name}?
          </h2>
          <p className="mx-auto mb-5 max-w-[500px] text-sm text-gray-500">
            Start the Fit Quiz to see if a {profile.name} matches your lifestyle and living situation.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2.5 rounded-full bg-purple-500 px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:bg-purple-600 hover:shadow-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Take the Fit Quiz
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 text-xs text-gray-400">
          <p>© 2026 Lukluk. All rights reserved.</p>
          <Link href="/" className="transition-colors hover:text-gray-900">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
