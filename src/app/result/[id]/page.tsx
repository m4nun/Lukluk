"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import MatchCard from "@/components/match-card/MatchCard";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { ErrorAlert } from "@/components/layout/ErrorAlert";
import { ArrowLeft, RefreshCw, Check, Loader2, Shield, Brain } from "lucide-react";

interface MatchEntry {
  pet_type_profile_id: string;
  pet_name?: string;
  species?: string;
  rank: number;
  responsible_fit_score: number;
  mbti_match_score: number;
  mbti_label?: string;
  explanation: string;
}

const PET_LOGOS: Record<string, string> = {
  "golden-retriever": "/assets/PetLogo/golden-retriever/1.png",
  "siamese-cat": "/assets/PetLogo/siamese-cat/1.png",
  "persian-cat": "/assets/PetLogo/persian-cat/1.png",
  "american-shorthair-cat": "/assets/PetLogo/american-shorthair-cat/1.png",
  "welsh-corgi": "/assets/PetLogo/welsh-corgi/1.png",
  "siberian-husky": "/assets/PetLogo/siberian-husky/1.png",
  "pug": "/assets/PetLogo/pug/1.png",
  "bulldog": "/assets/PetLogo/bulldog/1.png",
  "sphynx-cat": "/assets/PetLogo/sphynx-cat/1.png",
  "hamster": "/assets/PetLogo/hamster/1.png",
  "chinchilla": "/assets/PetLogo/chinchilla/1.png",
  "ferret": "/assets/PetLogo/ferret/1.png",
  "hedgehog": "/assets/PetLogo/hedgehog/1.png",
  "fennec-fox": "/assets/PetLogo/fennec-fox/1.png",
  "green-iguana": "/assets/PetLogo/green-iguana/1.png",
  "axolotl": "/assets/PetLogo/axolotl/1.png",
  "gerbil": "/assets/PetLogo/gerbil/1.png",
  "sugar-glider": "/assets/PetLogo/sugar-glider/1.png",
  "rabbit": "/assets/PetLogo/rabbit/1.png",
};

function loadFromSession(): MatchEntry[] | null {
  try {
    const raw = sessionStorage.getItem("lukluk_matches");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  async function load() {
    setLoading(true);
    setError("");

    // Try session storage first (guest flow)
    const sessionMatches = loadFromSession();
    if (sessionMatches && sessionMatches.length > 0) {
      setMatches(sessionMatches);
      setLoading(false);
      return;
    }

    // Try API (authenticated flow)
    try {
      const res = await fetch(`/api/match/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.top_matches?.length) {
          setMatches(data.top_matches);
          setLoading(false);
          return;
        }
      }
    } catch {
      // API unavailable
    }

    setError("Could not load matches. The result may have expired.");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "price_test" }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch {
      // Stripe test mode
    } finally {
      setSubscribing(false);
    }
  }

  function fitColor(score: number) {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-muted-foreground";
  }

  function fitBarColor(score: number) {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-muted-foreground";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[800px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight group">
            <Image src="/assets/logo.png" alt="Lukluk" width={32} height={32} className="transition-transform duration-300 group-hover:rotate-[-3deg] group-hover:scale-105" />
            Lukluk
          </Link>
          <Link
            href="/quiz"
            className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retake Quiz
          </Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[800px] flex-1 px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pt-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Your Pet Matches</h1>
            <p className="mt-1 text-muted-foreground">
              Ranked by Responsible Fit — budget, time, space, and lifestyle compatibility
            </p>
          </div>
          {matches.length > 0 && <MatchCard matches={matches} />}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-6 rounded-xl border-2 border-border bg-card p-7">
                <div className="h-14 w-14 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
                  <div className="h-2 w-3/5 animate-pulse rounded-full bg-muted" />
                  <div className="h-2 w-2/5 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-12 flex flex-col items-center text-center">
            <ErrorAlert>{error}</ErrorAlert>
            <button
              onClick={load}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-all hover:border-foreground/20 hover:-translate-y-px"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && matches.length > 0 && (
          <div className="mt-8 space-y-5 pb-12">
            {matches.map((m, i) => (
              <div
                key={m.pet_type_profile_id}
                className={`flex gap-6 rounded-xl border-2 p-7 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  m.rank === 1
                    ? "border-primary shadow-[0_0_0_4px_rgba(249,115,22,0.08)]"
                    : "border-border bg-card"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Rank badge with pet image */}
                <div
                  className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                    m.rank === 1
                      ? "h-16 w-16 shadow-lg shadow-primary/25"
                      : "h-14 w-14"
                  } font-bold`}
                >
                  {PET_LOGOS[m.pet_type_profile_id] ? (
                    <img
                      src={PET_LOGOS[m.pet_type_profile_id]}
                      alt={m.pet_name || m.pet_type_profile_id}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className={m.rank === 1 ? "bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-xl" : "bg-primary/10 text-primary w-full h-full flex items-center justify-center text-lg"}>
                      #{m.rank}
                    </span>
                  )}
                </div>

                {/* Match info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3
                      className={`font-bold tracking-tight ${
                        m.rank === 1 ? "text-2xl" : "text-xl"
                      }`}
                    >
                      {m.pet_name || m.pet_type_profile_id}
                    </h3>
                    {m.rank === 1 && (
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-primary">
                        Best Match
                      </span>
                    )}
                  </div>
                  {m.species && (
                    <span className="text-sm text-muted-foreground">{m.species}</span>
                  )}

                  {/* Score bars */}
                  <div className="mt-4 flex flex-wrap gap-6">
                    <div className="min-w-[160px]">
                      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Shield className="h-3.5 w-3.5" />
                        Fit
                        <span className={fitColor(m.responsible_fit_score)}>
                          {m.responsible_fit_score}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full ${fitBarColor(m.responsible_fit_score)} transition-all duration-700`}
                          style={{ width: `${m.responsible_fit_score}%` }}
                        />
                      </div>
                    </div>
                    <div className="min-w-[160px]">
                      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Brain className="h-3.5 w-3.5" />
                        MBTI
                        <span>{m.mbti_match_score}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                          style={{ width: `${m.mbti_match_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {m.mbti_label && (
                    <span className="mt-3 inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600">
                      {m.mbti_label}
                    </span>
                  )}

                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {m.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state — no matches, no error */}
        {!loading && !error && matches.length === 0 && (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">Take the quiz first</h2>
            <p className="mt-2 text-muted-foreground">
              You need to complete the Fit Quiz before viewing your matches.
            </p>
            <button
              onClick={() => router.push("/quiz")}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:-translate-y-px"
            >
              Start Quiz
            </button>
          </div>
        )}

        {/* Subscribe CTA */}
        <div className="my-12 rounded-2xl bg-primary/5 border border-primary/20 p-10 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Want to explore any of these?</h3>
          <p className="mx-auto mt-2 max-w-[440px] text-muted-foreground">
            Subscribe to create workspaces, chat with AI agents, track expenses, and get
            personalized care guidance.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-8">
            {[
              "Create planning workspaces",
              "Chat with AI Decision Agent",
              "Track expenses & concerns",
            ].map((b) => (
              <div key={b} className="flex items-center gap-2.5 text-sm">
                <Check className="h-5 w-5 text-success" />
                {b}
              </div>
            ))}
          </div>
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:-translate-y-px hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60"
          >
            {subscribing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Subscribe Now"
            )}
          </button>
        </div>
      </div>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        &copy; 2026 Lukluk. All rights reserved.
      </footer>
    </div>
  );
}
