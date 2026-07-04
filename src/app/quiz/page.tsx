"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FIXED_QUESTIONS } from "@/lib/quiz/questions";
import Link from "next/link";
import { ChevronLeft, Loader2, Check } from "lucide-react";

const TOTAL = FIXED_QUESTIONS.length;

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const question = FIXED_QUESTIONS[step];
  const answered = question ? answers[question.id] ?? null : null;

  function handleSelect(value: string) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (step < TOTAL - 1) {
      setTimeout(() => setStep((s) => s + 1), 200);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, followUpAnswers: [] }),
      });
      if (!res.ok) throw new Error("Match failed");
      const data = await res.json();
      router.push(`/result/${data.matchResultId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  if (finished) {
    return (
      <div className="flex min-h-screen flex-col">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between px-6">
            <span />
            <Link href="/" className="text-xl font-bold tracking-tight">
              🐾 Lukluk
            </Link>
            <span />
          </div>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="animate-scale-in mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
            <Check className="h-12 w-12 text-success" />
          </div>
          <h2 className="text-2xl font-bold">All done! 🎉</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">
            You've answered all {TOTAL} questions. Let's see your matches.
          </p>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Finding your matches...
              </>
            ) : (
              "See Your Matches"
            )}
          </button>
          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!question) {
    setFinished(true);
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between px-6">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <Link href="/" className="text-xl font-bold tracking-tight">
            🐾 Lukluk
          </Link>
          <button
            onClick={() => setFinished(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="mx-auto w-full max-w-[640px] px-6 pt-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Question {step + 1} of {TOTAL}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {Math.round(((step + 1) / TOTAL) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center px-6 pt-12 pb-16">
        <h2 className="max-w-[520px] text-center text-2xl font-bold leading-snug tracking-tight md:text-3xl">
          {question.question}
        </h2>

        <div className="mt-10 flex w-full max-w-[480px] flex-col gap-4">
          {question.options.map((opt, i) => {
            const selected = answered === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`flex items-center gap-4 rounded-xl border-2 px-6 py-5 text-left text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                  selected
                    ? "border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(249,115,22,0.1)] -translate-y-1"
                    : "border-transparent bg-card shadow-sm hover:border-primary/20 hover:shadow-md"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition-colors ${
                    selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {selected ? <Check className="h-5 w-5" /> : i + 1}
                </span>
                <span className="flex-1">{opt.label}</span>
                {selected && (
                  <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 w-full max-w-[480px] rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
