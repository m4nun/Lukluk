"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface OwnershipFormProps {
  onSubmit: (petName: string, ageLifeStage: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  petTypeName?: string;
}

const lifeStages = [
  { value: "puppy/kitten", label: "Puppy / Kitten", desc: "0–1 year" },
  { value: "young_adult", label: "Young Adult", desc: "1–3 years" },
  { value: "adult", label: "Adult", desc: "3–7 years" },
  { value: "senior", label: "Senior", desc: "7+ years" },
];

export default function OwnershipForm({
  onSubmit,
  loading: externalLoading,
  error: externalError,
  petTypeName,
}: OwnershipFormProps) {
  const [name, setName] = useState("");
  const [stage, setStage] = useState("adult");
  const [submitting, setSubmitting] = useState(false);

  const isLoading = externalLoading || submitting;
  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmedName, stage);
    } catch {
      // parent handles error display
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-base font-semibold">
        Already have {petTypeName ? `a ${petTypeName}` : "this pet"}?
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Switch to Ownership Mode to track expenses, activities, and get care
        help.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="pet-name"
            className="mb-1.5 block text-sm font-medium"
          >
            Pet Name
          </label>
          <input
            id="pet-name"
            type="text"
            placeholder="What's your pet's name?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
          />
        </div>

        <div>
          <label
            htmlFor="pet-stage"
            className="mb-1.5 block text-sm font-medium"
          >
            Age / Life Stage
          </label>
          <select
            id="pet-stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
          >
            {lifeStages.map((ls) => (
              <option key={ls.value} value={ls.value}>
                {ls.label} ({ls.desc})
              </option>
            ))}
          </select>
        </div>

        {externalError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {externalError}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Switching to Ownership...
            </>
          ) : (
            "Switch to Ownership Mode"
          )}
        </button>
      </form>
    </div>
  );
}
