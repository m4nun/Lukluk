"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AppNav } from "@/components/layout/AppNav";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorAlert } from "@/components/layout/ErrorAlert";
import { QuizModal } from "@/components/quiz/QuizModal";
import { ExplorePetModal } from "@/components/modals/ExplorePetModal";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { ChevronRight, RefreshCw, PawPrint, Home, Plus, Search } from "lucide-react";
import { getPetLogo } from "@/lib/pet-logos";

interface PlanningProfile {
  id: string;
  planning_name: string | null;
  decision_status: string;
  has_ownership: boolean;
  owned_pet_profile_id: string | null;
  pet_type_profiles: { name: string; species: string; mbti_label: string };
  pet_type_profile_id?: string;
}

const statusBadgeStyles: Record<string, string> = {
  exploring: "bg-blue-50 text-blue-500",
  considering: "bg-purple-50 text-purple-500",
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);

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

  async function checkLifestyleAndShowOnboarding() {
    try {
      const res = await fetch("/api/lifestyle");
      if (res.ok) {
        const data = await res.json();
        if (!data.hasLifestyle) {
          setShowOnboarding(true);
        }
      }
    } catch {
      // Allow user to proceed on error
    }
  }

  useEffect(() => {
    load();
    checkLifestyleAndShowOnboarding();
  }, [router]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setShowQuizModal(true);
  }, []);

  const handleQuizComplete = useCallback(() => {
    setShowQuizModal(false);
    load();
  }, [load]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />

      <div className="mx-auto w-full max-w-[960px] flex-1 px-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pt-12">
          <div>
            <h1 className="text-[clamp(24px,4vw,32px)] font-bold tracking-tight">My Workspaces</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your planning profiles and explore pet matches
            </p>
          </div>
          <button
            onClick={() => setShowExploreModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md"
          >
            <Search className="h-4 w-4" />
            Explore Pet
          </button>
        </div>

        {loading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} variant="card" />
            ))}
          </div>
        )}

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

        {!loading && !error && profiles.length === 0 && (
          <div className="mt-8">
            <EmptyState
              icon={<PawPrint className="h-8 w-8" />}
              title="No workspaces yet"
              description="Search for a pet to explore, or take the Fit Quiz to find your matches"
              ctaLabel="Explore Pets"
              onCta={() => setShowExploreModal(true)}
              variant="accent"
            />
          </div>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="mt-8 grid gap-5 pb-12 sm:grid-cols-2">
            {profiles.map((prof) => {
              const logoSrc = prof.pet_type_profile_id
                ? getPetLogo(prof.pet_type_profile_id)
                : null;
              return (
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
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-border overflow-hidden">
                    {logoSrc ? (
                      <Image src={logoSrc} alt="" width={52} height={52} className="object-cover" />
                    ) : (
                      <PawPrint className="h-6 w-6 text-muted-foreground" />
                    )}
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
                          ? "border border-primary/20 bg-primary/10 text-primary"
                          : statusBadgeStyles[prof.decision_status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {prof.has_ownership ? (
                        <><Home className="h-3 w-3 inline" /> Owned</>
                      ) : statusLabels[prof.decision_status] || prof.decision_status}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboarding Modal — first-time users see this before the quiz */}
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <QuizModal onComplete={handleQuizComplete} onClose={() => setShowQuizModal(false)} />
      )}

      {/* Explore Pet Modal */}
      {showExploreModal && (
        <ExplorePetModal
          onClose={() => setShowExploreModal(false)}
          onSelect={(slug) => {
            setShowExploreModal(false);
            router.push(`/pet/${slug}`);
          }}
        />
      )}
    </div>
  );
}
