"use client";

import { EmptyState } from "@/components/layout/EmptyState";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { useHighlight, useRowHighlight } from "@/hooks/use-highlight";
import { CircleDollarSign, MessageSquarePlus } from "lucide-react";

interface ExpenseItem {
  category: string;
  item: string;
  amount_thb: number;
  note?: string;
}

interface ExpenseTableProps {
  expenses: ExpenseItem[] | null;
  variant?: "planning" | "ownership";
  highlight?: boolean;
  onEmbedToChat?: (text: string) => void;
}

const planningLabels: Record<string, string> = {
  initial: "One-time Setup",
  monthly: "Monthly",
  annual: "Annual",
  one_time: "Other",
};

const ownershipLabels: Record<string, string> = {
  food: "Food",
  medical: "Medical",
  grooming: "Grooming",
  supplies: "Supplies",
  other: "Other",
};

export default function ExpenseTable({
  expenses,
  variant = "planning",
  highlight: externalHighlight,
  onEmbedToChat,
}: ExpenseTableProps) {
  const internalHighlight = useHighlight(expenses);
  const isHighlighted = externalHighlight ?? internalHighlight;
  const highlightedRows = useRowHighlight(expenses);

  if (expenses == null) {
    return <LoadingSkeleton variant="table" rows={6} />;
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<CircleDollarSign className="h-8 w-8" />}
        title="No expense estimates yet"
        description="Chat with the Decision Agent to get started with cost estimates."
        variant="gray"
      />
    );
  }

  const labels = variant === "ownership" ? ownershipLabels : planningLabels;
  const allCategories = Object.keys(labels);
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount_thb, 0);

  return (
    <div
      className={`space-y-4 rounded-lg transition-all duration-500 ${
        isHighlighted
          ? "bg-primary/10 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
          : ""
      }`}
    >
      {allCategories.map((cat) => {
        const items = expenses.filter((e) => e.category === cat);
        if (items.length === 0) return null;
        const total = items.reduce((sum, e) => sum + e.amount_thb, 0);

        return (
          <section
            key={cat}
            aria-labelledby={`cat-${cat}`}
            className="overflow-hidden rounded-lg border border-border"
          >
            <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {labels[cat] || cat}
              </span>
              <span className="text-sm font-bold tabular-nums">
                {total.toLocaleString()} THB
              </span>
            </div>
            {items.map((e, i) => {
              const rowKey = `${e.category}-${e.item}`;
              const isNew = highlightedRows.has(rowKey);

              return (
                <div
                  key={i}
                  className={`flex items-center border-t border-border px-4 py-2.5 transition-all duration-1000 last:border-b-0 ${
                    isNew
                      ? "bg-primary/20 shadow-inner"
                      : "hover:bg-primary/5"
                  }`}
                >
                  <span className="flex-1 text-sm">{e.item}</span>
                  <span className="min-w-[100px] text-right text-sm font-semibold tabular-nums">
                    {e.amount_thb.toLocaleString()} THB
                  </span>
                  {e.note && (
                    <span className="ml-3 max-w-[160px] truncate text-xs text-muted-foreground">
                      {e.note}
                    </span>
                  )}
                  {onEmbedToChat && (
                    <button
                      onClick={() => onEmbedToChat(`Tell me more about the "${e.item}" expense (${e.amount_thb} THB)`)}
                      className="ml-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Ask agent about this"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      <div className="flex items-center justify-between border-t-2 border-border px-4 pt-3">
        <span className="text-sm font-bold">Total Estimated Cost</span>
        <span className="text-sm font-bold tabular-nums">
          {grandTotal.toLocaleString()} THB
        </span>
      </div>
    </div>
  );
}
