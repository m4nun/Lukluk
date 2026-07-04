"use client";

import { EmptyState } from "@/components/layout/EmptyState";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { CircleDollarSign } from "lucide-react";

interface ExpenseItem {
  category: string;
  item: string;
  amount_thb: number;
  note?: string;
}

interface ExpenseTableProps {
  expenses: ExpenseItem[] | null;
  variant?: "planning" | "ownership";
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
}: ExpenseTableProps) {
  if (expenses === null) {
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
    <div className="space-y-4">
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
            {items.map((e, i) => (
              <div
                key={i}
                className="flex items-center border-t border-border px-4 py-2.5 transition-colors hover:bg-primary/5 last:border-b-0"
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
              </div>
            ))}
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
