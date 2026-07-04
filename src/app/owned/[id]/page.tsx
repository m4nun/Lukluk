"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AgentChat from "@/components/agent/AgentChat";
import ExpenseTable from "@/components/workspace/ExpenseTable";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ArrowLeft, PawPrint, AlertTriangle, Calendar, Utensils } from "lucide-react";

interface OwnedData {
  id: string;
  pet_name: string;
  age_life_stage: string;
  got_date: string | null;
  actual_expenses: Array<{
    category: string;
    item: string;
    amount_thb: number;
    note?: string;
  }>;
  activity_schedule: Array<{ day: string; activity: string; time: string }>;
  food_guide: { brand?: string; amount?: string; frequency?: string; notes?: string };
  pet_type_profiles: { name: string; species: string; mbti_label: string };
}

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function ageLabel(stage: string) {
  switch (stage) {
    case "puppy/kitten":
      return "Puppy / Kitten";
    case "young_adult":
      return "Young Adult";
    case "adult":
      return "Adult";
    case "senior":
      return "Senior";
    default:
      return stage;
  }
}

export default function OwnedPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<OwnedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expenses" | "activity" | "food">(
    "expenses",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ownership/${params.id}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          setError("Could not load pet profile");
        }
      } catch {
        setError("Could not connect. Check your internet connection.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex h-[52px] items-center border-b border-border px-5">
          <LoadingSkeleton variant="text" rows={1} />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 overflow-auto p-6">
            <LoadingSkeleton variant="card" />
            <div className="mt-6">
              <LoadingSkeleton variant="table" rows={6} />
            </div>
          </div>
          <div className="w-[420px] border-l border-border bg-card" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-6">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Profile not found</h2>
        <p className="mt-2 text-muted-foreground">
          {error || "This pet profile may have been removed."}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "expenses" as const, label: "Actual Expenses" },
    { key: "activity" as const, label: "Activity Schedule" },
    { key: "food" as const, label: "Food Guide" },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Nav */}
      <nav className="flex h-[52px] shrink-0 items-center border-b border-border bg-card px-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-base">
            <Image src="/assets/logo.png" alt="Lukluk" width={20} height={20} />
            Lukluk
          </Link>
          <span className="block h-5 w-px bg-border" />
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
        <div className="mx-auto flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full overflow-hidden bg-success/10">
            <PawPrint className="h-3.5 w-3.5 text-success" />
          </div>
          <span className="text-sm font-semibold">{data.pet_name}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/5 px-2.5 py-0.5 text-[11px] font-semibold text-success">
            Owned
          </span>
        </div>
        <div className="w-[100px]" />
      </nav>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 overflow-y-auto border-r border-border p-6">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-success/20 bg-success/5">
              <PawPrint className="h-5 w-5 text-success" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{data.pet_name}</h1>
              <p className="text-sm text-muted-foreground">
                {data.pet_type_profiles.name} · {ageLabel(data.age_life_stage)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-border mb-5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-0.5 ${
                  activeTab === t.key
                    ? "border-success text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "expenses" && (
            <ExpenseTable
              expenses={data.actual_expenses}
              variant="ownership"
            />
          )}

          {activeTab === "activity" && (
            <div>
              {data.activity_schedule.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="h-8 w-8" />}
                  title="No schedule yet"
                  description="The Care Agent can help build a daily routine for your pet."
                  variant="accent"
                />
              ) : (
                <div className="space-y-3">
                  {DAY_ORDER.filter((day) =>
                    data.activity_schedule.some((a) => a.day === day),
                  ).map((day) => (
                    <div
                      key={day}
                      className="overflow-hidden rounded-lg border border-border bg-card"
                    >
                      <div className="bg-muted/50 border-b border-border px-4 py-2.5 text-sm font-semibold">
                        {day}
                      </div>
                      {data.activity_schedule
                        .filter((a) => a.day === day)
                        .map((a, i) => (
                          <div
                            key={i}
                            className="flex items-baseline gap-3 border-b border-border px-4 py-2 text-sm last:border-b-0"
                          >
                            <span className="min-w-[60px] text-sm font-semibold text-primary tabular-nums">
                              {a.time}
                            </span>
                            <span>{a.activity}</span>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "food" && (
            <div>
              {!data.food_guide.brand ? (
                <EmptyState
                  icon={<Utensils className="h-8 w-8" />}
                  title="No food guide yet"
                  description="Chat with the Care Agent for personalized feeding recommendations."
                  variant="accent"
                />
              ) : (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h4 className="text-sm font-semibold mb-3">
                    Feeding Guide
                  </h4>
                  <div className="space-y-0">
                    {[
                      { label: "Brand", value: data.food_guide.brand },
                      { label: "Amount per serving", value: data.food_guide.amount },
                      { label: "Frequency", value: data.food_guide.frequency },
                      { label: "Notes", value: data.food_guide.notes },
                    ]
                      .filter((r) => r.value)
                      .map((r) => (
                        <div
                          key={r.label}
                          className="flex justify-between border-b border-border py-2 text-sm last:border-b-0"
                        >
                          <span className="text-muted-foreground">
                            {r.label}
                          </span>
                          <span className="font-medium">{r.value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel — Care Chat */}
        <div className="w-[420px] shrink-0 flex flex-col bg-card">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
            <span className="h-2 w-2 rounded-full bg-success" />
            <div>
              <h3 className="text-sm font-semibold">Care Agent</h3>
              <p className="text-xs text-muted-foreground">Always available</p>
            </div>
          </div>
          <AgentChat
            endpoint="/api/agent/care"
            bodyKey="ownedProfileId"
            profileId={params.id}
            suggestions={[
              "Track an expense",
              "Build a daily routine",
              "What food should I buy?",
            ]}
            placeholder="Ask about feeding, schedules, expenses..."
            emptyTitle="Hi! I'm your Care Agent"
            emptyDescription="Ask me about feeding, activity routines, tracking expenses, or any care concerns."
          />
        </div>
      </div>
    </div>
  );
}
