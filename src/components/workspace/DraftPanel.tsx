"use client";

import { useState, useEffect } from "react";
import type { AgentDraft } from "@/lib/types";
import { Check, X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export default function DraftPanel({ planningProfileId }: { planningProfileId: string }) {
  const { t } = useI18n();
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

  function draftLabel(target: string) {
    switch (target) {
      case "estimated_expenses": return t.drafts.expenseUpdate;
      case "concern_checklist": return t.drafts.concernUpdate;
      case "decision_status": return t.drafts.statusChange;
      default: return t.drafts.update;
    }
  }

  return (
    <div className="border-t border-warning/30 bg-warning/5 px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="h-2 w-2 rounded-full bg-warning" />
        {t.drafts.title} ({drafts.length})
      </div>
      <div className="space-y-2">
        {drafts.map((draft) => (
          <div key={draft.id} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 text-xs text-muted-foreground">
              {draftLabel(draft.target)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(draft.id, "confirm")}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                {t.drafts.accept}
              </button>
              <button
                onClick={() => handleAction(draft.id, "reject")}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-all hover:border-foreground/20 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
                {t.drafts.reject}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
