"use client";

import { EmptyState } from "@/components/layout/EmptyState";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { useHighlight } from "@/hooks/use-highlight";
import { Utensils, Scale, Clock, StickyNote } from "lucide-react";

interface FoodGuide {
  brand?: string | null;
  amount?: string | null;
  frequency?: string | null;
  notes?: string | null;
}

interface FoodGuideCardProps {
  guide: FoodGuide | null;
  highlight?: boolean;
}

interface StatCard {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

export default function FoodGuideCard({ guide, highlight: externalHighlight }: FoodGuideCardProps) {
  const internalHighlight = useHighlight(guide);
  const isHighlighted = externalHighlight ?? internalHighlight;

  if (guide === null) {
    return <LoadingSkeleton variant="card" />;
  }

  if (!guide.brand && !guide.amount && !guide.frequency && !guide.notes) {
    return (
      <EmptyState
        icon={<Utensils className="h-6 w-6" />}
        title="No food guide yet"
        description="Ask the Care Agent for feeding recommendations."
        variant="accent"
      />
    );
  }

  const cards: StatCard[] = [
    { icon: Utensils, label: "Brand", value: guide.brand || "" },
    { icon: Scale, label: "Amount per serving", value: guide.amount || "" },
    { icon: Clock, label: "Frequency", value: guide.frequency || "" },
    { icon: StickyNote, label: "Notes", value: guide.notes || "" },
  ].filter((c) => c.value !== "");

  return (
    <div
      className={`grid grid-cols-2 gap-3 transition-all duration-500 ${
        isHighlighted ? "bg-primary/10 ring-2 ring-primary/30 shadow-lg shadow-primary/10 rounded-lg p-3 -m-3" : ""
      }`}
    >
      {cards.map((card) => {
        const IconComp = card.icon;
        return (
          <div
            key={card.label}
            className="flex flex-col rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <IconComp className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold truncate">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
