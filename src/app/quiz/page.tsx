"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FIXED_QUESTIONS } from "@/lib/quiz/questions";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, PiggyBank, Clock, Home, Siren, Plane, Volume2, PawPrint, GraduationCap, Baby, Check, X, Minus } from "lucide-react";

const TOTAL = FIXED_QUESTIONS.length;
const MAX_FOLLOW_UPS = 5;

const QUESTION_ICONS = [
  PiggyBank, Clock, Home, Siren, Plane,
  Volume2, PawPrint, GraduationCap, Baby,
];

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [followUpStep, setFollowUpStep] = useState(0);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);

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

  async function handleFinish() {
    setFinished(true);
    setGeneratingFollowUp(true);
    setError("");

    let hasFollowUp = false;

    try {
      const res = await fetch("/api/match/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, followUps: [] }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.finished && data.followUpQuestions?.length) {
          setFollowUpQuestions(data.followUpQuestions.slice(0, MAX_FOLLOW_UPS));
          setFollowUpAnswers(new Array(data.followUpQuestions.length).fill(""));
          setShowFollowUp(true);
          setFinished(false);
          hasFollowUp = true;
        }
      }
    } catch {
      // follow-up failed, proceed to match
    }

    setGeneratingFollowUp(false);

    if (!hasFollowUp) {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          followUpAnswers: showFollowUp
            ? followUpQuestions.map((q, i) => ({ question: q, answer: followUpAnswers[i] || "" }))
            : [],
        }),
      });
      if (!res.ok) throw new Error("Match failed");
      const data = await res.json();
      sessionStorage.setItem("lukluk_matches", JSON.stringify(data.matches));
      sessionStorage.setItem("lukluk_match_id", data.matchResultId || "latest");
      router.push(`/result/${data.matchResultId || "latest"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  function handleFollowUpAnswer(value: string) {
    const next = [...followUpAnswers];
    next[followUpStep] = value;
    setFollowUpAnswers(next);
    if (followUpStep < followUpQuestions.length - 1) {
      setTimeout(() => setFollowUpStep((s) => s + 1), 200);
    } else {
      handleSubmit();
    }
  }

  if (showFollowUp && followUpStep < followUpQuestions.length) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[640px] items-center px-6">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <Image src="/assets/logo.png" alt="Lukluk" width={28} height={28} />
              Lukluk
            </Link>
          </div>
        </nav>

        <div className="mx-auto w-full max-w-[640px] px-6 pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              Clarifying Question {followUpStep + 1} of {followUpQuestions.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-warning transition-all duration-600 ease-out"
              style={{ width: `${((followUpStep + 1) / followUpQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center px-6 pt-16 pb-16">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <svg className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          <h2 className="max-w-[520px] text-center text-2xl font-bold leading-snug tracking-tight">
            {followUpQuestions[followUpStep]}
          </h2>

          <p className="mt-4 text-sm text-muted-foreground text-center">
            This helps narrow your best matches
          </p>

          <div className="mt-10 flex w-full max-w-[480px] flex-col gap-4">
            <button
              onClick={() => handleFollowUpAnswer("Yes")}
              className="flex items-center gap-4 rounded-2xl border-2 border-transparent bg-card px-6 py-5 text-left text-[15px] font-medium transition-all duration-300 shadow-sm hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"><Check className="h-5 w-5" /></span>
              <span>Yes</span>
            </button>
            <button
              onClick={() => handleFollowUpAnswer("No")}
              className="flex items-center gap-4 rounded-2xl border-2 border-transparent bg-card px-6 py-5 text-left text-[15px] font-medium transition-all duration-300 shadow-sm hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"><X className="h-5 w-5" /></span>
              <span>No</span>
            </button>
            <button
              onClick={() => handleFollowUpAnswer("Not sure")}
              className="flex items-center gap-4 rounded-2xl border-2 border-transparent bg-card px-6 py-5 text-left text-[15px] font-medium transition-all duration-300 shadow-sm hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><Minus className="h-5 w-5" /></span>
              <span>Not sure</span>
            </button>
            <button
              onClick={() => handleSubmit()}
              className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Skip all clarifying questions
            </button>
          </div>

          {error && (
            <div className="mt-6 w-full max-w-[480px] rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[640px] items-center px-6">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <Image src="/assets/logo.png" alt="Lukluk" width={28} height={28} />
              Lukluk
            </Link>
          </div>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          {generatingFollowUp ? (
            <>
              <div className="animate-scale-in mb-6">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold">Analyzing your answers...</h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Checking if we need any clarification before finding your matches.
              </p>
            </>
          ) : (
            <>
              <div className="animate-scale-in mb-6">
                <CheckCircle className="h-24 w-24 text-success" style={{ fillOpacity: 0.1 }} />
              </div>
              <h2 className="text-2xl font-bold">All done!</h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                You've answered all {TOTAL} questions. Let's find the pet types that truly fit your life.
              </p>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_4px_16px_rgba(249,115,22,0.25)] transition-all hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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
                <div className="mt-6 max-w-[480px] rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between px-6">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
            Back
          </button>
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Image src="/assets/logo.png" alt="Lukluk" width={28} height={28} />
            Lukluk
          </Link>
          <button
            onClick={handleFinish}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground rounded-full px-3 py-2 hover:bg-muted"
          >
            Skip
          </button>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[640px] px-6 pt-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Question {step + 1} of {TOTAL}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {Math.round(((step + 1) / TOTAL) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-600 ease-out"
            style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center px-6 pt-12 pb-16">
        <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {(() => {
            const Icon = QUESTION_ICONS[step % QUESTION_ICONS.length];
            return <Icon className="h-6 w-6 text-primary" />;
          })()}
        </div>

        <h2 className="max-w-[520px] text-center text-[clamp(24px,4vw,32px)] font-bold leading-snug tracking-tight">
          {question.question}
        </h2>

        <div className="mt-10 flex w-full max-w-[480px] flex-col gap-4">
          {question.options.map((opt, i) => {
            const selected = answered === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`flex items-center gap-4 rounded-2xl border-2 px-6 py-5 text-left text-[15px] font-medium transition-all duration-300 shadow-sm ${
                  selected
                    ? "border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(249,115,22,0.1)] -translate-y-1"
                    : "border-transparent bg-card hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5"
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition-colors ${
                    selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1">{opt.label}</span>
                {selected && (
                  <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-primary-foreground">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 w-full max-w-[480px] rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
