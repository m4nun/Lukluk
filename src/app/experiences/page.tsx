"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorAlert } from "@/components/layout/ErrorAlert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Experience {
  id: string;
  pet_type_profile_id?: string;
  title: string;
  body: string;
  ownership_duration: string | null;
  created_at: string;
  profiles?: { name: string; species?: string };
}

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

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [petTypeId, setPetTypeId] = useState("");
  const [hasOwned, setHasOwned] = useState(true);
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  async function loadExperiences() {
    try {
      const res = await fetch("/api/experiences");
      if (res.ok) {
        setExperiences(await res.json());
      }
    } catch {
      // silent
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadExperiences();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petTypeProfileId: petTypeId,
          title,
          body,
          hasOwned,
          ownershipDuration: duration || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }

      const data = await res.json();
      setExperiences((prev) => [
        {
          id: data.id,
          title,
          body,
          ownership_duration: duration || null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowForm(false);
      setTitle("");
      setBody("");
      setPetTypeId("");
      setDuration("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[800px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            🐾 Lukluk
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-foreground"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[800px] flex-1 px-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Owner Experiences</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
              showForm
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:border-foreground/20"
            }`}
          >
            {showForm ? "Cancel" : "Share Your Experience"}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          These are anecdotal experiences from self-declared owners — not expert
          advice.
        </div>

        {/* Submission Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-2xl border border-border bg-card p-6"
          >
            <h3 className="text-base font-bold mb-4">Share your experience</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold">
                  Pet Type
                </label>
                <input
                  value={petTypeId}
                  onChange={(e) => setPetTypeId(e.target.value)}
                  placeholder="e.g., golden-retriever"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your experience?"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold">
                  Your Experience
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share your story..."
                  required
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10 resize-y min-h-[100px]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Ownership Duration
                </label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 2 years"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
                />
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOwned}
                    onChange={(e) => setHasOwned(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  I have owned this pet
                </label>
              </div>
            </div>

            {error && (
              <ErrorAlert variant="danger" onClose={() => setError("")} className="mt-4">
                {error}
              </ErrorAlert>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Share"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-foreground/20"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {initialLoading && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                <div className="mt-3 h-3 w-24 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!initialLoading && experiences.length === 0 && (
          <div className="mt-8">
            <EmptyState
              icon="📝"
              title="No experiences shared yet"
              description="Be the first to share your pet ownership story with the community."
              ctaLabel="Share Your Experience"
              onCta={() => setShowForm(true)}
              variant="accent"
            />
          </div>
        )}

        {/* Feed */}
        {!initialLoading && experiences.length > 0 && (
          <div className="mt-8 space-y-4 pb-16">
            {experiences.map((exp) => (
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
                {exp.pet_type_profile_id && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {exp.pet_type_profile_id.replace(/-/g, " ")}
                  </p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {exp.body}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(exp.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
