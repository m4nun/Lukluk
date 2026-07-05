import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { getPetLogo } from "@/lib/pet-logos";
import {
  PawPrint,
  Check,
  Coins,
  Home,
  Clock,
  GraduationCap,
} from "lucide-react";

const MBTI_WORDS: Record<string, string> = {
  I: "Introverted", E: "Extraverted",
  N: "Intuitive", S: "Sensing",
  F: "Feeling", T: "Thinking",
  J: "Judging", P: "Perceiving",
};

const MBTI_DESCRIPTIONS: Record<string, string> = {
  INFJ: "The Advocate", INTJ: "The Architect", INFP: "The Mediator", INTP: "The Logician",
  ISFJ: "The Defender", ISTJ: "The Logistician", ISFP: "The Adventurer", ISTP: "The Virtuoso",
  ENFJ: "The Protagonist", ENTJ: "The Commander", ENFP: "The Campaigner", ENTP: "The Debater",
  ESFJ: "The Consul", ESTJ: "The Executive", ESFP: "The Entertainer", ESTP: "The Entrepreneur",
};

const TRAIT_COLORS = [
  "bg-purple-50 text-purple-600",
  "bg-pink-50 text-pink-600",
  "bg-cyan-50 text-cyan-600",
  "bg-lime-50 text-lime-600",
  "bg-orange-50 text-orange-600",
];

const DIM_COLORS = ["bg-purple-500", "bg-cyan-500", "bg-pink-500", "bg-lime-500"];

interface PetProfile {
  id: string; name: string; species: string; breed_or_category: string; description: string;
  mbti_label: string; mbti_traits: string[]; mbti_description: string;
  daily_active_minutes_min: number; daily_active_minutes_max: number;
  alone_tolerance_hours: number; grooming_frequency: string;
  daily_attention_hours: number; monthly_cost_min_thb: number; monthly_cost_max_thb: number;
  space_tier: string; minimum_sq_meters: number; indoor_only_ok: boolean;
  feeding_per_day: number; experience_level: string; exercise_type: string;
  vet_visit_frequency: string;
}

function computeDimensions(pet: PetProfile) {
  const activeMid = ((pet.daily_active_minutes_min + pet.daily_active_minutes_max) / 2 / 180) * 100;
  const energyPct = Math.min(100, Math.max(10, Math.round(activeMid)));
  const indepPct = Math.min(100, Math.max(10, Math.round((pet.alone_tolerance_hours / 12) * 100)));
  const groomingMap: Record<string, number> = { low: 25, moderate: 50, high: 75, very_high: 95 };
  const groomPct = groomingMap[pet.grooming_frequency] ?? 50;
  const affectionPct = Math.min(100, Math.max(10, Math.round((pet.daily_attention_hours / 8) * 100)));

  return [
    { label: "Energy", value: energyPct, display: energyPct < 40 ? "Low" : energyPct < 70 ? "Low-Med" : "High" },
    { label: "Independence", value: indepPct, display: indepPct < 40 ? "Low" : indepPct < 70 ? "Med" : "High" },
    { label: "Grooming", value: groomPct, display: groomPct < 30 ? "Low" : groomPct < 60 ? "Med" : groomPct < 80 ? "High" : "Very High" },
    { label: "Affection", value: affectionPct, display: affectionPct < 30 ? "Low" : affectionPct < 60 ? "Moderate" : affectionPct < 80 ? "High" : "Very High" },
  ];
}

function computeCompatibility(current: PetProfile, others: PetProfile[]) {
  return others
    .filter((p) => p.id !== current.id)
    .map((p) => {
      let score = 50;
      if (p.species === current.species) score += 20;
      score = Math.min(98, score + Math.floor(Math.random() * 5));
      return { ...p, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

export default async function PetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pet } = await supabase.from("pet_type_profiles").select("*").eq("id", slug).single();
  if (!pet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Pet not found</h1>
        <Link href="/" className="mt-4 text-orange-500 hover:underline">Back to Lukluk</Link>
      </div>
    );
  }

  const { data: allPets } = await supabase
    .from("pet_type_profiles")
    .select("id, name, species, breed_or_category");

  const profile = pet as PetProfile;
  const logoSrc = getPetLogo(slug);
  const dimensions = computeDimensions(profile);
  const compatiblePets = allPets ? computeCompatibility(profile, allPets as PetProfile[]) : [];

  const mbtiCode = profile.mbti_label.slice(0, 4).toUpperCase();
  const mbtiTitle = MBTI_DESCRIPTIONS[mbtiCode] || profile.mbti_label.split("—")[0].trim();
  const personalityWords = mbtiCode.split("").map((l) => MBTI_WORDS[l] || l);

  const careCards = [
    { label: "Budget", value: `฿${profile.monthly_cost_min_thb.toLocaleString()} - ${profile.monthly_cost_max_thb.toLocaleString()} /mo`, desc: "Food, grooming, vet", icon: <Coins className="h-4 w-4" />, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Space", value: profile.space_tier === "apartment" ? "Apartment OK" : "House Needed", desc: profile.indoor_only_ok ? "Indoor living works" : "Outdoor access recommended", icon: <Home className="h-4 w-4" />, color: "text-cyan-500", bg: "bg-cyan-50" },
    { label: "Time", value: `${profile.daily_active_minutes_min}-${profile.daily_active_minutes_max} min / day`, desc: `${profile.exercise_type} + play`, icon: <Clock className="h-4 w-4" />, color: "text-pink-500", bg: "bg-pink-50" },
    { label: "Level", value: profile.experience_level === "beginner" ? "Beginner-friendly" : profile.experience_level === "intermediate" ? "Intermediate" : "Experienced", desc: `${profile.grooming_frequency} grooming`, icon: <GraduationCap className="h-4 w-4" />, color: "text-lime-600", bg: "bg-lime-50" },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .anim { animation: fadeUp 0.4s ease both; }
        .anim-d1 { animation-delay: 0.1s; }
        .anim-d2 { animation-delay: 0.15s; }
        .anim-d3 { animation-delay: 0.2s; }
        .anim-d4 { animation-delay: 0.25s; }
        .anim-d5 { animation-delay: 0.3s; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-[#fafafa]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
            <Image src="/assets/logo.png" alt="Lukluk" width={24} height={24} />
            Lukluk
          </Link>
          <Link href="/" className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-[640px] px-5 pb-10">
        {/* Hero */}
        <section className="flex items-center gap-6 pt-8 anim" aria-labelledby="pet-name">
          <div className="h-[100px] w-[100px] flex-shrink-0 overflow-hidden rounded-2xl bg-purple-50">
            {logoSrc ? (
              <Image src={logoSrc} alt={profile.name} width={100} height={100} className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center"><PawPrint className="h-8 w-8 text-gray-300" /></div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 id="pet-name" className="mb-1 text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
              {profile.name}
            </h1>
            <p className="mb-3 text-sm text-gray-500">{profile.description}</p>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500 px-3.5 py-1.5 text-[13px] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              {mbtiCode}
              <span className="text-[11px] font-semibold opacity-90">
                {personalityWords.join(", ")}
              </span>
            </div>
          </div>
        </section>

        {/* Dimensions */}
        <section className="mt-7 anim anim-d1" aria-labelledby="dim-title">
          <h2 id="dim-title" className="mb-3 flex items-center gap-1.5 text-[15px] font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <svg className="h-[18px] w-[18px] text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Lifestyle Match
          </h2>
          <div className="flex flex-col gap-3">
            {dimensions.map((dim, i) => (
              <div key={dim.label} className="flex items-center gap-3">
                <span className="w-[110px] flex-shrink-0 text-[13px] font-medium text-gray-500">{dim.label}</span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div className={`absolute inset-y-0 left-0 rounded-full ${DIM_COLORS[i]}`} style={{ width: `${dim.value}%` }} />
                </div>
                <span className="w-[72px] flex-shrink-0 text-right text-xs font-semibold text-gray-900">{dim.display}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Traits */}
        <section className="mt-7 anim anim-d2" aria-labelledby="trait-title">
          <h2 id="trait-title" className="mb-3 flex items-center gap-1.5 text-[15px] font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <svg className="h-[18px] w-[18px] text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Traits
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.mbti_traits.map((trait, i) => (
              <span key={trait} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium ${TRAIT_COLORS[i % TRAIT_COLORS.length]}`}>
                <Check className="h-3.5 w-3.5" />
                {trait}
              </span>
            ))}
          </div>
        </section>

        {/* Care */}
        <section className="mt-7 anim anim-d3" aria-labelledby="care-title">
          <h2 id="care-title" className="mb-3 flex items-center gap-1.5 text-[15px] font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <svg className="h-[18px] w-[18px] text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Care Needs
          </h2>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            {careCards.map((card, i) => (
              <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bg}`}>
                    <span className={card.color}>{card.icon}</span>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{card.label}</span>
                </div>
                <div className="text-sm font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>{card.value}</div>
                <div className="mt-1 text-xs text-gray-400 leading-relaxed">{card.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Compatible */}
        {compatiblePets.length > 0 && (
          <section className="mt-7 anim anim-d4" aria-labelledby="compat-title">
            <h2 id="compat-title" className="mb-3 flex items-center gap-1.5 text-[15px] font-bold" style={{ fontFamily: "var(--font-display)" }}>
              <svg className="h-[18px] w-[18px] text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Compatible Breeds
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {compatiblePets.map((cp) => {
                const cpLogo = getPetLogo(cp.id);
                return (
                  <Link key={cp.id} href={`/pet/${cp.id}`} className="flex-none w-[140px] snap-start rounded-xl border border-gray-200 bg-white p-4 text-center transition-colors hover:border-purple-400">
                    <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-xl bg-purple-50">
                      {cpLogo ? (
                        <Image src={cpLogo} alt={cp.name} width={56} height={56} className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><PawPrint className="h-5 w-5 text-gray-300" /></div>
                      )}
                    </div>
                    <div className="text-[13px] font-semibold text-gray-900">{cp.name}</div>
                    <span className="mt-1 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-600">{cp.matchScore}%</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-7 rounded-2xl bg-purple-500 p-6 text-center text-white anim anim-d5">
          <h2 className="mb-1.5 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Ready to meet your {profile.name}?</h2>
          <p className="mb-4 text-[13px] opacity-90">Take the Fit Quiz to see if this breed matches your lifestyle.</p>
          <Link href="/quiz" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-purple-500 transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ fontFamily: "var(--font-display)" }}>
            Take the Fit Quiz
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        © 2026 Lukluk
      </footer>
    </div>
  );
}
