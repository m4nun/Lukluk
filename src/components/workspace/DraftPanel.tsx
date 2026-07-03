"use client";

import { useState, useEffect } from "react";
import type { AgentDraft } from "@/lib/types";

export default function DraftPanel({ planningProfileId }: { planningProfileId: string }) {
  const [drafts, setDrafts] = useState<AgentDraft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDrafts();
    const interval = setInterval(loadDrafts, 5000);
    return () => clearInterval(interval);
  }, [planningProfileId]);

  async function loadDrafts() {
    try {
      const res = await fetch(`/api/agent/drafts?planningProfileId=${planningProfileId}`);
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch {
      // ignore polling errors
    }
  }

  async function handleAction(draftId: string, action: "confirm" | "reject") {
    setLoading(true);
    try {
      await fetch("/api/agent/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, action }),
      });
      loadDrafts();
    } finally {
      setLoading(false);
    }
  }

  if (drafts.length === 0) return null;

  return (
    <div style={{ padding: 12, borderTop: "1px solid #eee", background: "#fffbeb" }}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
        Agent Proposals ({drafts.length})
      </div>
      {drafts.map((draft) => (
        <div key={draft.id} style={{ marginBottom: 8, padding: 8, border: "1px solid #e5e5e5", borderRadius: 6, background: "white" }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
            {draft.target === "estimated_expenses" && "Expense update"}
            {draft.target === "concern_checklist" && "Concern update"}
            {draft.target === "decision_status" && "Status change"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleAction(draft.id, "confirm")}
              disabled={loading}
              style={{ padding: "4px 12px", fontSize: 13 }}
            >
              Accept
            </button>
            <button
              onClick={() => handleAction(draft.id, "reject")}
              disabled={loading}
              style={{ padding: "4px 12px", fontSize: 13 }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
