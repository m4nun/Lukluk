"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AgentChat from "@/components/agent/AgentChat";
import ExpenseTable from "@/components/workspace/ExpenseTable";
import ConcernChecklist from "@/components/workspace/ConcernChecklist";
import DecisionStatus from "@/components/workspace/DecisionStatus";
import DraftPanel from "@/components/workspace/DraftPanel";
import GuidanceGate from "@/components/workspace/GuidanceGate";
import OwnershipForm from "@/components/workspace/OwnershipForm";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { ErrorAlert } from "@/components/layout/ErrorAlert";
import { ArrowLeft } from "lucide-react";

interface WorkspaceData {
  id: string;
  planning_name: string | null;
  decision_status: string;
  estimated_expenses: Array<{
    category: string;
    item: string;
    amount_thb: number;
    note?: string;
  }>;
  concern_checklist: Array<{
    concern_id: string;
    title: string;
    status: string;
    note?: string;
    resolved_at?: string;
  }>;
  pet_type_profiles: {
    name: string;
    species: string;
    mbti_label: string;
    description: string;
  };
  has_ownership: boolean;
}

const PET_EMOJIS: Record<string, string> = {
  Dog: "🐕",
  Cat: "🐈",
  Rabbit: "🐇",
  Hamster: "🐹",
  Gerbil: "🐭",
  Chinchilla: "🐿️",
  Ferret: "🦡",
  Hedgehog: "🦔",
  "Sugar Glider": "🦘",
  "Fennec Fox": "🦊",
  "Green Iguana": "🦎",
  Axolotl: "🐟",
};

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"expenses" | "concerns">("expenses");
  const [seenExpenses, setSeenExpenses] = useState(false);
  const [seenConcerns, setSeenConcerns] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [transitionError, setTransitionError] = useState("");

  function switchTab(tab: "expenses" | "concerns") {
    setActiveTab(tab);
    if (tab === "expenses") setSeenExpenses(true);
    if (tab === "concerns") setSeenConcerns(true);
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/planning");
        if (!res.ok) throw new Error("Failed to load");
        const profiles = await res.json();
        const profile = profiles.find(
          (p: { id: string }) => p.id === params.id,
        );
        if (!profile) throw new Error("Workspace not found");
        setData(profile);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error loading workspace");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleStatusUpdate(newStatus: string) {
    if (!data) return;
    setStatusUpdating(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planningProfileId: params.id,
          message: `[system: update decision status to ${newStatus}]`,
        }),
      });
      if (res.ok) {
        setData((prev) =>
          prev ? { ...prev, decision_status: newStatus } : null,
        );
      }
    } catch {
      // optimistic update failed, keep current status
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleOwnership(petName: string, ageLifeStage: string) {
    setTransitionError("");
    try {
      const res = await fetch("/api/ownership/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planningProfileId: params.id,
          petName,
          ageLifeStage,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        router.push(`/owned/${result.ownedProfileId}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setTransitionError(err.message || "Failed to switch to ownership");
      }
    } catch {
      setTransitionError("Could not connect. Check your internet and try again.");
    }
  }

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
          <div className="w-[400px] border-l border-border bg-card" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-6">
        <div className="mb-4 text-5xl">⚠️</div>
        <h2 className="text-xl font-bold">Workspace not found</h2>
        <p className="mt-2 max-w-sm text-center text-muted-foreground">
          {error || "This workspace may have been deleted."}
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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Nav */}
      <nav className="flex h-[52px] shrink-0 items-center border-b border-border bg-card px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="mx-auto flex items-center gap-2">
          <span className="text-lg">
            {PET_EMOJIS[data.pet_type_profiles.species] || "🐾"}
          </span>
          <span className="text-sm font-semibold">
            {data.planning_name || data.pet_type_profiles.name}
          </span>
          <span className="text-xs text-muted-foreground">
            · {data.pet_type_profiles.species}
          </span>
        </div>
        <div className="w-[80px]" />
      </nav>

      {/* Workspace body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 overflow-y-auto border-r border-border bg-background">
          {/* Header */}
          <div className="px-6 pt-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary/5 text-2xl">
                {PET_EMOJIS[data.pet_type_profiles.species] || "🐾"}
              </div>
              <div>
                <h1 className="text-lg font-bold">
                  {data.planning_name || data.pet_type_profiles.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {data.pet_type_profiles.species} ·{" "}
                  {data.pet_type_profiles.mbti_label}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <DecisionStatus
                status={data.decision_status}
                onUpdate={handleStatusUpdate}
                disabled={statusUpdating}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex border-b border-border px-6">
            <button
              onClick={() => switchTab("expenses")}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === "expenses"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Estimated Expenses
            </button>
            <button
              onClick={() => switchTab("concerns")}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === "concerns"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Concern Checklist
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {activeTab === "expenses" ? (
              <ExpenseTable expenses={data.estimated_expenses} />
            ) : (
              <ConcernChecklist concerns={data.concern_checklist} />
            )}
          </div>

          {/* Drafts */}
          <DraftPanel planningProfileId={params.id} />

          {/* Guidance */}
          <div className="px-6 mt-4 pb-4">
            <GuidanceGate
              hasSeenExpenses={seenExpenses}
              hasSeenConcerns={seenConcerns}
              expenseCount={data.estimated_expenses?.length}
              concernCount={data.concern_checklist?.length}
            />
          </div>

          {/* Ownership form */}
          {!data.has_ownership && (
            <div className="px-6 pb-6">
              <OwnershipForm
                onSubmit={handleOwnership}
                error={transitionError}
                petTypeName={data.pet_type_profiles.name}
              />
            </div>
          )}
        </div>

        {/* Right Panel — Agent Chat */}
        <div className="w-[400px] shrink-0 flex flex-col bg-card">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <div>
              <h3 className="text-sm font-semibold">Decision Agent</h3>
              <p className="text-xs text-muted-foreground">Always available</p>
            </div>
          </div>
          <AgentChat planningProfileId={params.id} />
        </div>
      </div>
    </div>
  );
}
