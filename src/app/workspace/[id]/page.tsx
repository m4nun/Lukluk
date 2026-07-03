"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AgentChat from "@/components/agent/AgentChat";
import ExpenseTable from "@/components/workspace/ExpenseTable";
import ConcernChecklist from "@/components/workspace/ConcernChecklist";
import DecisionStatus from "@/components/workspace/DecisionStatus";
import DraftPanel from "@/components/workspace/DraftPanel";
import GuidanceGate from "@/components/workspace/GuidanceGate";

interface WorkspaceData {
  id: string;
  planning_name: string | null;
  decision_status: string;
  estimated_expenses: Array<{ category: string; item: string; amount_thb: number; note?: string }>;
  concern_checklist: Array<{ concern_id: string; title: string; status: string; note?: string }>;
  pet_type_profiles: { name: string; species: string; mbti_label: string; description: string };
  has_ownership: boolean;
}

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"expenses" | "concerns">("expenses");
  const [seenExpenses, setSeenExpenses] = useState(false);
  const [seenConcerns, setSeenConcerns] = useState(false);

  function switchTab(tab: "expenses" | "concerns") {
    setActiveTab(tab);
    if (tab === "expenses") setSeenExpenses(true);
    if (tab === "concerns") setSeenConcerns(true);
  }

  useEffect(() => {
    async function load() {
      try {
        // Use planning API to get workspace data
        const res = await fetch("/api/planning");
        if (!res.ok) throw new Error("Failed to load");
        const profiles = await res.json();
        const profile = profiles.find((p: { id: string }) => p.id === params.id);
        if (!profile) throw new Error("Workspace not found");
        setData(profile);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleOwnership(petName: string, ageLifeStage: string) {
    try {
      const res = await fetch("/api/ownership/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planningProfileId: params.id, petName, ageLifeStage }),
      });
      if (res.ok) {
        const result = await res.json();
        router.push(`/owned/${result.ownedProfileId}`);
      }
    } catch {
      setError("Failed to convert to ownership");
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading workspace...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
  if (!data) return null;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Panel — Structured Data */}
      <div style={{ flex: 1, overflow: "auto", padding: 24, borderRight: "1px solid #eee" }}>
        <h2>{data.planning_name || data.pet_type_profiles.name}</h2>
        <p style={{ color: "#666" }}>
          {data.pet_type_profiles.species} · {data.pet_type_profiles.mbti_label}
        </p>

        <DecisionStatus
          status={data.decision_status}
          onUpdate={async (newStatus) => {
            const res = await fetch("/api/agent/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planningProfileId: params.id,
                message: `[system: update decision status to ${newStatus}]`,
              }),
            });
            if (res.ok) {
              setData((prev) => prev ? { ...prev, decision_status: newStatus } : null);
            }
          }}
        />

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          <button onClick={() => switchTab("expenses")} style={{ fontWeight: activeTab === "expenses" ? "bold" : "normal" }}>
            Estimated Expenses
          </button>
          <button onClick={() => switchTab("concerns")} style={{ fontWeight: activeTab === "concerns" ? "bold" : "normal" }}>
            Concern Checklist
          </button>
        </div>

        {activeTab === "expenses" ? (
          <ExpenseTable expenses={data.estimated_expenses} />
        ) : (
          <ConcernChecklist concerns={data.concern_checklist} />
        )}

        <DraftPanel planningProfileId={params.id} />

        <div style={{ marginTop: 16 }}>
          <GuidanceGate hasSeenExpenses={seenExpenses} hasSeenConcerns={seenConcerns} />
        </div>

        {!data.has_ownership && (
          <div style={{ marginTop: 32, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
            <h3>Already have this pet?</h3>
            <OwnershipForm onSubmit={handleOwnership} />
          </div>
        )}
      </div>

      {/* Right Panel — Agent Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <AgentChat planningProfileId={params.id} />
      </div>
    </div>
  );
}

function OwnershipForm({ onSubmit }: { onSubmit: (name: string, stage: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [stage, setStage] = useState("adult");

  return (
    <div>
      <input
        placeholder="Pet name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ display: "block", marginBottom: 8, padding: "4px 8px" }}
      />
      <select value={stage} onChange={(e) => setStage(e.target.value)} style={{ display: "block", marginBottom: 8, padding: "4px 8px" }}>
        <option value="puppy/kitten">Puppy/Kitten</option>
        <option value="young_adult">Young Adult</option>
        <option value="adult">Adult</option>
        <option value="senior">Senior</option>
      </select>
      <button onClick={() => onSubmit(name, stage)} disabled={!name}>
        Switch to Ownership Mode
      </button>
    </div>
  );
}
