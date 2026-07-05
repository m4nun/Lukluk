"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AgentChat from "@/components/agent/AgentChat";
import ExpenseTable from "@/components/workspace/ExpenseTable";
import ConcernChecklist from "@/components/workspace/ConcernChecklist";
import DecisionStatus from "@/components/workspace/DecisionStatus";
import DraftPanel from "@/components/workspace/DraftPanel";
import OwnershipForm from "@/components/workspace/OwnershipForm";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { ArrowLeft, AlertTriangle, PawPrint } from "lucide-react";

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

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"expenses" | "concerns">("expenses");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [transitionError, setTransitionError] = useState("");

  function switchTab(tab: "expenses" | "concerns") {
    setActiveTab(tab);
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

  async function refreshData() {
    try {
      const res = await fetch("/api/planning");
      if (res.ok) {
        const profiles = await res.json();
        const profile = profiles.find(
          (p: { id: string }) => p.id === params.id,
        );
        if (profile) setData(profile);
      }
    } catch {
      // silent fail on refresh
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    if (!data) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/planning/${params.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
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
          <PawPrint className="h-5 w-5 text-muted-foreground" />
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
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 min-w-0 overflow-y-auto border-r border-border bg-background">
          {/* Header */}
          <div className="px-6 pt-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary/5">
                <PawPrint className="h-6 w-6 text-primary" />
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
        <div className="w-[380px] shrink-0 flex flex-col bg-card overflow-hidden border-l border-border">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3 shrink-0">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <div>
              <h3 className="text-sm font-semibold">Decision Agent</h3>
              <p className="text-xs text-muted-foreground">Always available</p>
            </div>
          </div>
          <AgentChat
            endpoint="/api/agent/chat"
            bodyKey="planningProfileId"
            profileId={params.id}
            suggestions={[
              "Show me the costs",
              "What are the main concerns?",
              "Does this pet fit my lifestyle?",
              "How much time does this pet need?",
            ]}
            placeholder="Ask about costs, concerns, lifestyle fit..."
            emptyTitle="Hi! I'm your Decision Agent"
            emptyDescription="Ask me anything about this pet type — costs, concerns, whether it fits your lifestyle."
            onMessageSent={refreshData}
          />
        </div>
      </div>
    </div>
  );
}
