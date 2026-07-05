"use client";

import { useState, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Search, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

const statuses = [
  { value: "exploring", label: "Exploring", icon: Search },
  { value: "considering", label: "Considering", icon: HelpCircle },
  { value: "ready_to_buy", label: "Ready to adopt", icon: CheckCircle },
  { value: "not_a_fit", label: "Not a fit", icon: XCircle },
  { value: "already_have", label: "Already have", icon: CheckCircle },
] as const;

type DecisionStatusValue = (typeof statuses)[number]["value"];

const badgeStyles: Record<string, string> = {
  exploring: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  considering: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
  ready_to_buy: "bg-success/10 text-success border border-success/20",
  not_a_fit: "bg-destructive/10 text-destructive border border-destructive/20",
  already_have: "bg-sky-500/10 text-sky-500 border border-sky-500/20",
};

const dotStyles: Record<string, string> = {
  exploring: "bg-blue-500",
  considering: "bg-purple-500",
  ready_to_buy: "bg-success",
  not_a_fit: "bg-destructive",
  already_have: "bg-sky-500",
};

interface DecisionStatusProps {
  status: string;
  onUpdate: (newStatus: string) => Promise<void>;
  disabled?: boolean;
}

export default function DecisionStatus({
  status,
  onUpdate,
  disabled,
}: DecisionStatusProps) {
  const { t } = useI18n();
  const [updating, setUpdating] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    if (prevStatus.current !== status) {
      setHighlight(true);
      prevStatus.current = status;
      const timer = setTimeout(() => setHighlight(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const current = statuses.find((s) => s.value === status) || statuses[0];

  async function handleSelect(newStatus: string) {
    if (updating || newStatus === status) return;
    setUpdating(true);
    try {
      await onUpdate(newStatus);
    } finally {
      setUpdating(false);
      setOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{t.status.statusLabel}</span>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          disabled={disabled || updating}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-all duration-500 hover:shadow-sm",
            badgeStyles[status] || "bg-gray-100 text-gray-500",
            (disabled || updating) && "cursor-not-allowed opacity-60",
            highlight && "ring-2 ring-primary/50 shadow-lg shadow-primary/20",
          )}
        >
          {updating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              {t.status.updating}
            </>
          ) : (
            <>
              <current.icon className="h-3 w-3" />
              {current.label}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          {statuses.map((s) => (
            <DropdownMenuItem
              key={s.value}
              onClick={() => handleSelect(s.value)}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                s.value === status && "bg-accent font-semibold",
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
