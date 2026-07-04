"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorAlert } from "@/components/layout/ErrorAlert";
import { ChevronRight, RefreshCw } from "lucide-react";

interface PlanningProfile {
  id: string;
  planning_name: string | null;
  decision_status: string;
  has_ownership: boolean;
  owned_pet_profile_id: string | null;
  pet_type_profiles: { name: string; species: string; mbti_label: string };
}

const PET_EMOJIS: Record<string, string> = {
  Dog: "🐕",
  Cat: "🐈",
  Rabbit: "🐇",
  Hamster: "🐹",
  Gerbil: "🐭",
  Chinchilla: "🐿️",
  Ferret: "🦡",
  Hedgehog: "🦔",
  "Sugar Glider": "🦘",
  "Fennec Fox": "🦊",
  "Green Iguana": "🦎",
  Axolotl: "🐟",
};

const statusBadgeStyles: Record<string, string> = {
  exploring: "bg-blue-500/10 text-blue-500",
  considering: "bg-purple-500/10 text-purple-500",
  ready_to_buy: "bg-success/10 text-success",
  not_a_fit: "bg-destructive/10 text-destructive",
  already_have: "bg-primary/10 text-primary",
};

const statusLabels: Record<string, string> = {
  exploring: "Exploring",
  considering: "Considering",
  ready_to_buy: "Ready",
  not_a_fit: "Not a fit",
  already_have: "Owned",
};

export default function DashboardPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<PlanningProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/planning");
      if (res.status === 402) {
        router.push("/result/0");
        return;
      }
      if (!res.ok) throw new Error("Failed to load profiles");
      const data = await res.json();
      setProfiles(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profiles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            🐾 Lukluk
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/experiences" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Experiences
            </Link>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:border-foreground/20"
            >
              New Quiz
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[960px] flex-1 px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pt-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Workspaces</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your planning profiles and explore pet matches.
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} variant="card" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-8">
            <ErrorAlert title="Error" onClose={() => setError("")}>
              {error}
            </ErrorAlert>
            <button
              onClick={load}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && profiles.length === 0 && (
          <div className="mt-8">
            <EmptyState
              icon="📋"
              title="No workspaces yet"
              description="Take the Fit Quiz to discover your top pet matches, then create a workspace to explore them in depth."
              ctaLabel="Take the Quiz"
              onCta={() => router.push("/quiz")}
              variant="accent"
            />
          </div>
        )}

        {/* Profiles grid */}
        {!loading && !error && profiles.length > 0 && (
          <div className="mt-8 grid gap-5 pb-12 sm:grid-cols-2">
            {profiles.map((prof) => (
              <div
                key={prof.id}
                onClick={() => {
                  if (prof.has_ownership && prof.owned_pet_profile_id) {
                    router.push(`/owned/${prof.owned_pet_profile_id}`);
                  } else {
                    router.push(`/workspace/${prof.id}`);
                  }
                }}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-primary/5 text-2xl overflow-hidden">
                  {PET_EMOJIS[prof.pet_type_profiles.species] || "🐾"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold truncate">
                    {prof.planning_name || prof.pet_type_profiles.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {prof.pet_type_profiles.species} · {prof.pet_type_profiles.mbti_label}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      prof.has_ownership
                        ? "bg-primary/10 text-primary"
                        : statusBadgeStyles[prof.decision_status] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {prof.has_ownership ? "🏠 Owned" : statusLabels[prof.decision_status] || prof.decision_status}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
