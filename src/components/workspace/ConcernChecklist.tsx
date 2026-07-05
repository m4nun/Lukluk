"use client";

import { useState } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { useHighlight, useRowHighlight } from "@/hooks/use-highlight";
import { MessageSquarePlus, Check, Circle } from "lucide-react";

interface ConcernItem {
  concern_id: string;
  title: string;
  status: string;
  note?: string;
  resolved_at?: string;
}

interface ConcernChecklistProps {
  concerns: ConcernItem[] | null;
  readonly?: boolean;
  highlight?: boolean;
  onEmbedToChat?: (text: string) => void;
  onStatusChange?: (concernId: string, status: string) => void;
  workspaceId?: string;
}

function statusDot(status: string) {
  switch (status) {
    case "resolved":
      return "bg-success";
    case "not_applicable":
      return "bg-gray-400";
    default:
      return "bg-warning";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "resolved":
      return "bg-success/10 text-success border border-success/20";
    case "not_applicable":
      return "bg-gray-400/10 text-gray-400 border border-gray-400/20";
    default:
      return "bg-warning/10 text-warning-foreground border border-warning/20";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "resolved":
      return "Resolved";
    case "not_applicable":
      return "N/A";
    default:
      return "Unresolved";
  }
}

export default function ConcernChecklist({
  concerns,
  readonly = false,
  highlight: externalHighlight,
  onEmbedToChat,
  onStatusChange,
  workspaceId,
}: ConcernChecklistProps) {
  const internalHighlight = useHighlight(concerns);
  const isHighlighted = externalHighlight ?? internalHighlight;
  const highlightedRows = useRowHighlight(concerns);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (concerns == null) {
    return <LoadingSkeleton variant="table" rows={5} />;
  }

  if (concerns.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No concerns logged yet"
        description="Chat with the Decision Agent to identify potential concerns."
        variant="gray"
      />
    );
  }

  const seen = new Set<string>();
  const unique = concerns.filter((c) => {
    if (seen.has(c.concern_id)) return false;
    seen.add(c.concern_id);
    return true;
  });

  const unresolved = unique.filter((c) => c.status === "unresolved").length;
  const total = unique.length;
  const allResolved = unique.every((c) => c.status === "resolved");
  const allNA = unique.every((c) => c.status === "not_applicable");

  let summary = `${unresolved} of ${total} concerns unresolved`;
  let summaryColor = "text-warning";
  if (allResolved) {
    summary = `All ${total} concerns resolved ✓`;
    summaryColor = "text-success";
  } else if (allNA) {
    summary = "All concerns marked not applicable";
    summaryColor = "text-muted-foreground";
  }

  async function toggleConcern(concernId: string, currentStatus: string) {
    if (readonly || updatingId || !workspaceId) return;
    const newStatus = currentStatus === "resolved" ? "unresolved" : "resolved";
    setUpdatingId(concernId);
    try {
      const res = await fetch(`/api/planning/${workspaceId}/concerns`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern_id: concernId, status: newStatus }),
      });
      if (res.ok) {
        onStatusChange?.(concernId, newStatus);
      }
    } catch {
      // silent fail
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div
      className={`rounded-lg transition-all duration-500 ${
        isHighlighted
          ? "bg-primary/10 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
          : ""
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${allResolved ? "bg-success" : "bg-warning"}`}
        />
        <span className={`text-sm font-semibold ${summaryColor}`}>
          {summary}
        </span>
      </div>

      <div className="space-y-0">
        {unique.map((c) => {
          const isNew = highlightedRows.has(c.concern_id);

          return (
            <div
              key={c.concern_id}
              className={`flex items-start gap-3 border-b border-border px-1 py-3 transition-all duration-1000 last:border-b-0 ${
                isNew
                  ? "bg-primary/20 shadow-inner"
                  : "hover:bg-accent/50"
              }`}
            >
              {!readonly && (
                <button
                  onClick={() => toggleConcern(c.concern_id, c.status)}
                  disabled={updatingId === c.concern_id}
                  className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                  title={c.status === "resolved" ? "Mark unresolved" : "Mark resolved"}
                >
                  {c.status === "resolved" ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground hover:text-success" />
                  )}
                </button>
              )}
              {readonly && (
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${statusDot(c.status)}`}
                />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${c.status === "resolved" ? "line-through text-muted-foreground" : ""}`}>
                  {c.title}
                </span>
                {c.note && (
                  <p className="mt-0.5 text-xs italic text-muted-foreground">
                    {c.note}
                  </p>
                )}
                {c.resolved_at && c.status === "resolved" && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Resolved{" "}
                    {new Date(c.resolved_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(c.status)}`}
                >
                  {statusLabel(c.status)}
                </span>
                {onEmbedToChat && (
                  <button
                    onClick={() => onEmbedToChat(`Tell me more about "${c.title}" concern`)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Ask agent about this"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
