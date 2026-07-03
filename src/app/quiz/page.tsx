"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FIXED_QUESTIONS } from "@/lib/quiz/questions";

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const question = FIXED_QUESTIONS[step];
  const progress = ((step + 1) / FIXED_QUESTIONS.length) * 100;

  function handleSelect(value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    if (step < FIXED_QUESTIONS.length - 1) {
      setStep((s) => s + 1);
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
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (!question) {
    return (
      <div style={{ padding: 24 }}>
        <h2>All done!</h2>
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Matching..." : "See Your Matches"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
      <div style={{ height: 4, background: "#eee", marginBottom: 16 }}>
        <div style={{ height: 4, width: `${progress}%`, background: "#333" }} />
      </div>

      <p style={{ fontSize: 12, color: "#666" }}>Question {step + 1} of {FIXED_QUESTIONS.length}</p>

      <h2>{question.question}</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            style={{
              padding: "12px 16px",
              textAlign: "left",
              border: "1px solid #ccc",
              borderRadius: 8,
              background: answers[question.id] === opt.value ? "#e0e0e0" : "white",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <button onClick={handleBack} disabled={step === 0}>
          Back
        </button>
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Matching..." : "Skip to results"}
        </button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
