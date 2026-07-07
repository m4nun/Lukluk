"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Plus, X, AlertCircle } from "lucide-react";
import { AppNav } from "@/components/layout/AppNav";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";

interface Experience {
  id: string;
  title: string;
  body: string;
  ownership_duration: string | null;
  pet_type_profile_id?: string;
  created_at: string;
  profiles?: { display_name: string | null };
}

interface PetType {
  id: string;
  name: string;
  species: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    pet_type_profile_id: "",
    title: "",
    body: "",
    ownership_duration: "",
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/experiences");
      if (res.ok) {
        const data = await res.json();
        setExperiences(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function loadPetTypes() {
    if (petTypes.length > 0) {
      setShowForm(true);
      return;
    }
    try {
      const res = await fetch("/api/pet");
      if (res.ok) {
        const data = await res.json();
        setPetTypes(data);
        if (data.length > 0) {
          setForm((f) => ({ ...f, pet_type_profile_id: data[0].id }));
        }
      }
    } catch {
    } finally {
      setShowForm(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pet_type_profile_id || !form.title.trim() || !form.body.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_type_profile_id: form.pet_type_profile_id,
          title: form.title,
          body: form.body,
          ownership_duration: form.ownership_duration || null,
        }),
      });
      if (res.ok) {
        setForm({ pet_type_profile_id: petTypes[0]?.id || "", title: "", body: "", ownership_duration: "" });
        setShowForm(false);
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not submit experience. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />

      <div className="mx-auto w-full max-w-[800px] flex-1 px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pt-12">
          <h1 className="text-[clamp(24px,4vw,32px)] font-bold tracking-tight">Owner Experiences</h1>
          <button
            onClick={showForm ? () => setShowForm(false) : loadPetTypes}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-all hover:border-foreground/20 hover:-translate-y-0.5"
          >
            {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Share experience</>}
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Real stories from real owners. These are anecdotal experiences, not expert advice.
        </p>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold mb-4">Share your experience</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="exp-pet">Pet type</label>
                <select
                  id="exp-pet"
                  value={form.pet_type_profile_id}
                  onChange={(e) => setForm((f) => ({ ...f, pet_type_profile_id: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  {petTypes.length === 0 && <option value="">Loading…</option>}
                  {petTypes.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="exp-title">Title</label>
                <input
                  id="exp-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={120}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="What should others know?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="exp-body">Your experience</label>
                <textarea
                  id="exp-body"
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  maxLength={2000}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-vertical"
                  placeholder="Share what surprised you, what you'd do differently, or what you love most."
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">{form.body.length} / 2000</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="exp-duration">How long have you owned? (optional)</label>
                <input
                  id="exp-duration"
                  type="text"
                  value={form.ownership_duration}
                  onChange={(e) => setForm((f) => ({ ...f, ownership_duration: e.target.value }))}
                  maxLength={60}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., 2 years, 6 months"
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {submitting ? "Posting…" : "Post experience"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-all hover:border-foreground/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-8 space-y-4 pb-12">
          {loading && [1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <LoadingSkeleton variant="text" rows={2} />
            </div>
          ))}

          {!loading && experiences.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <h2 className="mt-3 text-base font-semibold">No experiences yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to share your story.</p>
            </div>
          )}

          {!loading && experiences.map((exp) => (
            <article key={exp.id} className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
              <header className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                  {exp.profiles?.display_name?.[0] || "?"}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {exp.profiles?.display_name || "Anonymous"}
                </span>
                {exp.ownership_duration && (
                  <span className="text-xs text-muted-foreground">· {exp.ownership_duration}</span>
                )}
                <time className="ml-auto text-xs text-muted-foreground" dateTime={exp.created_at}>
                  {timeAgo(exp.created_at)}
                </time>
              </header>
              <h3 className="text-base font-semibold mb-1">{exp.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{exp.body}</p>
            </article>
          ))}
        </div>

        <div className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}