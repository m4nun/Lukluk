"use client";

import { EmptyState } from "@/components/layout/EmptyState";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";

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
}: ConcernChecklistProps) {
  if (concerns === null) {
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

  // Deduplicate by concern_id
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

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${allResolved ? "bg-success" : "bg-warning"}`}
        />
        <span className={`text-sm font-semibold ${summaryColor}`}>
          {summary}
        </span>
      </div>

      <div className="space-y-0">
        {unique.map((c) => (
          <div
            key={c.concern_id}
            className="flex items-start gap-3 border-b border-border px-1 py-3 transition-colors hover:bg-accent/50 last:border-b-0"
          >
            <span
              className={`mt-1 h-3 w-3 shrink-0 rounded-full ${statusDot(c.status)}`}
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{c.title}</span>
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
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(c.status)}`}
            >
              {statusLabel(c.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
