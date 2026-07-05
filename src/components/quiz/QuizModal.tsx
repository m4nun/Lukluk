"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FIXED_QUESTIONS } from "@/lib/quiz/questions";
import { X, ArrowLeft, Loader2, Send, PiggyBank, Clock, Home, Siren, Plane, Volume2, PawPrint, GraduationCap, Baby } from "lucide-react";

const TOTAL = FIXED_QUESTIONS.length;
const MAX_FOLLOW_UPS = 5;

const QUESTION_ICONS = [
  PiggyBank, Clock, Home, Siren, Plane,
  Volume2, PawPrint, GraduationCap, Baby,
];

type Phase = "quiz" | "analyzing" | "followup" | "matching";

interface FollowUpQuestion {
  question: string;
  options: string[];
}

interface QuizModalProps {
  onComplete: () => void;
  onClose: () => void;
}

export function QuizModal({ onComplete, onClose }: QuizModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("quiz");
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [followUpStep, setFollowUpStep] = useState(0);
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  const question = FIXED_QUESTIONS[step];
  const answered = question ? answers[question.id] ?? null : null;

  function handleSelect(value: string) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (step < TOTAL - 1) {
      setTimeout(() => setStep((s) => s + 1), 200);
    } else {
      setTimeout(() => handleFinish(), 300);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleFinish() {
    setPhase("analyzing");
    setError("");

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
          setFollowUpAnswers([]);
          setFollowUpStep(0);
          setPhase("followup");
          return;
        }
      }
    } catch {
      // LLM fail — skip to match
    }

    handleSubmit([]);
  }

  async function handleSubmit(followUps: Array<{ question: string; answer: string }>) {
    setPhase("matching");
    setError("");
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, followUpAnswers: followUps }),
      });
      if (!res.ok) throw new Error("Match failed");
      const data = await res.json();
      sessionStorage.setItem("lukluk_matches", JSON.stringify(data.matches));
      sessionStorage.setItem("lukluk_match_id", data.matchResultId || "latest");
      onComplete();
      router.push(`/result/${data.matchResultId || "latest"}`);
    } catch (e) {
      setPhase("analyzing");
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    }
  }

  async function handleFollowUpSubmit() {
    if (submittingFollowUp) return;

    const selectedAnswer = followUpAnswers[followUpStep];
    if (!selectedAnswer) return;

    setSubmittingFollowUp(true);

    if (followUpStep < followUpQuestions.length - 1) {
      setFollowUpStep((s) => s + 1);
      setSubmittingFollowUp(false);
    } else {
      const all = followUpQuestions.map((q, i) => ({
        question: q.question,
        answer: followUpAnswers[i] || "",
      }));
      await handleSubmit(all);
    }
  }

  function handleOptionSelect(option: string) {
    const nextAnswers = [...followUpAnswers];
    nextAnswers[followUpStep] = option;
    setFollowUpAnswers(nextAnswers);
  }

  async function handleSkipFollowUps() {
    const all = followUpQuestions.slice(0, followUpStep).map((q, i) => ({
      question: q.question,
      answer: followUpAnswers[i] || "",
    }));
    await handleSubmit(all);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex h-[90vh] w-full max-w-[640px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Image src="/assets/logo.png" alt="Lukluk" width={24} height={24} />
            <span className="font-bold text-gray-900">Fit Quiz</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* QUIZ PHASE */}
          {phase === "quiz" && question && (
            <div className="flex flex-col items-center px-6 pt-6 pb-8">
              {/* Progress */}
              <div className="w-full mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.05em] text-gray-500">
                    Question {step + 1} of {TOTAL}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.05em] text-gray-500">
                    {Math.round(((step + 1) / TOTAL) * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-600 ease-out"
                    style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
                  />
                </div>
              </div>

              {/* Icon */}
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
                {(() => {
                  const Icon = QUESTION_ICONS[step % QUESTION_ICONS.length];
                  return <Icon className="h-6 w-6 text-orange-500" />;
                })()}
              </div>

              {/* Question */}
              <h2 className="max-w-[520px] text-center text-[clamp(20px,3.5vw,28px)] font-bold leading-snug tracking-tight text-gray-900">
                {question.question}
              </h2>

              {/* Options */}
              <div className="mt-8 w-full max-w-[480px] flex flex-col gap-3">
                {question.options.map((opt, i) => {
                  const selected = answered === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-[15px] font-medium transition-all duration-300 shadow-sm ${
                        selected
                          ? "border-orange-500 bg-orange-50 shadow-[0_0_0_4px_rgba(249,115,22,0.1)] -translate-y-0.5"
                          : "border-transparent bg-gray-50 hover:border-orange-200 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition-colors ${
                          selected ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1">{opt.label}</span>
                      {selected && (
                        <span className="shrink-0 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-white">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Back button */}
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="mt-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
            </div>
          )}

          {/* ANALYZING PHASE */}
          {phase === "analyzing" && (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Analyzing your answers...</h2>
              <p className="mt-2 max-w-sm text-gray-500">
                Checking if we need any clarification before finding your matches.
              </p>
            </div>
          )}

          {/* FOLLOW-UP PHASE */}
          {phase === "followup" && followUpStep < followUpQuestions.length && (
            <div className="flex flex-col items-center px-6 pt-6 pb-8">
              <div className="w-full mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.05em] text-gray-500">
                    Clarifying Question {followUpStep + 1} of {followUpQuestions.length}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-600 ease-out"
                    style={{ width: `${((followUpStep + 1) / followUpQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>

              <h2 className="max-w-[520px] text-center text-xl font-bold leading-snug tracking-tight text-gray-900">
                {followUpQuestions[followUpStep].question}
              </h2>

              <div className="mt-6 w-full max-w-[520px] flex flex-col gap-3">
                {followUpQuestions[followUpStep].options.map((option, i) => {
                  const selected = followUpAnswers[followUpStep] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleOptionSelect(option)}
                      className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-[15px] font-medium transition-all duration-300 shadow-sm ${
                        selected
                          ? "border-amber-400 bg-amber-50 shadow-[0_0_0_4px_rgba(251,191,36,0.1)] -translate-y-0.5"
                          : "border-transparent bg-gray-50 hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition-colors ${
                          selected ? "bg-amber-400 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between w-full max-w-[520px]">
                <button
                  onClick={handleSkipFollowUps}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Skip all
                </button>
                <button
                  onClick={handleFollowUpSubmit}
                  disabled={!followUpAnswers[followUpStep] || submittingFollowUp}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submittingFollowUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {followUpStep < followUpQuestions.length - 1 ? "Next" : "Finish"}
                </button>
              </div>
            </div>
          )}

          {/* MATCHING PHASE */}
          {phase === "matching" && (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Finding your matches...</h2>
              <p className="mt-2 max-w-sm text-gray-500">
                Scoring all 19 pet types across 8 dimensions to find your best fits.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-6 mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
