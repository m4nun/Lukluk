"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";

interface ShareExperienceProps {
  petTypeProfileId: string;
  petName: string;
  onSubmitted?: () => void;
}

export default function ShareExperience({ petTypeProfileId, petName, onSubmitted }: ShareExperienceProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ownershipDuration, setOwnershipDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petTypeProfileId,
          title: title.trim(),
          body: body.trim(),
          hasOwned: true,
          ownershipDuration: ownershipDuration.trim() || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTitle("");
        setBody("");
        setOwnershipDuration("");
        onSubmitted?.();
      } else if (res.status === 401) {
        setError("Please sign in to share your experience");
      } else if (res.status === 402) {
        setError("Subscription required to share experiences");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to submit. Please try again.");
      }
    } catch {
      setError("Could not connect. Check your internet.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
        <p className="text-sm font-semibold text-green-700">Experience shared!</p>
        <p className="mt-1 text-xs text-green-600">Thank you for sharing your experience with {petName}.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-3 text-xs font-semibold text-green-700 underline hover:text-green-800"
        >
          Share another experience
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-[15px] font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
        <Send className="h-[18px] w-[18px] text-purple-500" />
        Share Your Experience
      </h3>

      <div className="space-y-3">
        <div>
          <label htmlFor="exp-title" className="mb-1 block text-[13px] font-medium text-gray-700">
            Title
          </label>
          <input
            id="exp-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`My experience with ${petName}`}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label htmlFor="exp-body" className="mb-1 block text-[13px] font-medium text-gray-700">
            Your Experience
          </label>
          <textarea
            id="exp-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience owning or caring for this pet..."
            required
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
          />
        </div>

        <div>
          <label htmlFor="exp-duration" className="mb-1 block text-[13px] font-medium text-gray-700">
            Ownership Duration <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="exp-duration"
            type="text"
            value={ownershipDuration}
            onChange={(e) => setOwnershipDuration(e.target.value)}
            placeholder="e.g., 2 years, 6 months"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !title.trim() || !body.trim()}
        className="mt-4 w-full rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Share Experience
          </>
        )}
      </button>
    </form>
  );
}
