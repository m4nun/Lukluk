"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type AlertVariant = "danger" | "warning" | "success";

interface ErrorAlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-warning/30 bg-warning/10 text-warning-foreground",
  success: "border-success/30 bg-success/10 text-success",
};

export function ErrorAlert({
  variant = "danger",
  title,
  children,
  onClose,
  className,
}: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <p className={title ? "text-xs" : ""}>{children}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto shrink-0 opacity-50 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
