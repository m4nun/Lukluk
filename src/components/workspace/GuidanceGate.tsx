"use client";

import { cn } from "@/lib/utils";
import { Lock, Unlock, Check, Circle } from "lucide-react";

interface GuidanceGateProps {
  hasSeenExpenses: boolean;
  hasSeenConcerns: boolean;
  expenseCount?: number;
  concernCount?: number;
  onRequestHelp?: () => void;
}

export default function GuidanceGate({
  hasSeenExpenses,
  hasSeenConcerns,
  expenseCount,
  concernCount,
  onRequestHelp,
}: GuidanceGateProps) {
  const isUnlocked = hasSeenExpenses && hasSeenConcerns;

  if (!isUnlocked) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <div className="mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-muted-foreground">
            Adoption Guidance
          </h4>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Complete the following to unlock personalized adoption tips:
        </p>
        <div className="space-y-2">
          <div
            className={cn(
              "flex items-center gap-2 text-sm",
              hasSeenExpenses
                ? "text-success line-through"
                : "text-muted-foreground",
            )}
          >
            {hasSeenExpenses ? (
              <Check className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4 opacity-40" />
            )}
            Review estimated expenses
            {!hasSeenExpenses && (
              <span className="text-xs text-muted-foreground/60">
                — Click the Expenses tab
              </span>
            )}
          </div>
          <div
            className={cn(
              "flex items-center gap-2 text-sm",
              hasSeenConcerns
                ? "text-success line-through"
                : "text-muted-foreground",
            )}
          >
            {hasSeenConcerns ? (
              <Check className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4 opacity-40" />
            )}
            Review concern checklist
            {!hasSeenConcerns && (
              <span className="text-xs text-muted-foreground/60">
                — Click the Concerns tab
              </span>
            )}
          </div>
        </div>
        {onRequestHelp && (
          <button
            onClick={onRequestHelp}
            className="mt-4 text-sm font-medium text-primary underline hover:no-underline"
          >
            Need help? Ask the Decision Agent
          </button>
        )}
      </div>
    );
  }

  const tips = [
    "Research reputable breeders or adoption centers",
    "Ask about health certifications and guarantees",
    "Visit in person before committing",
    "Prepare your home before your pet arrives",
  ];

  return (
    <div className="rounded-xl border border-success/20 bg-success/5 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Unlock className="h-4 w-4 text-success" />
        <h4 className="text-sm font-semibold text-success">
          Adoption Guidance
        </h4>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        You've reviewed costs and concerns. Here are tips for bringing your pet
        home:
      </p>
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {i + 1}
            </span>
            <span className="text-sm">{tip}</span>
          </div>
        ))}
      </div>
      {onRequestHelp && (
        <button
          onClick={onRequestHelp}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/20"
        >
          Still unsure? Chat with the agent
        </button>
      )}
    </div>
  );
}
