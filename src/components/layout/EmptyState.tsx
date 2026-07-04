"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  variant?: "accent" | "gray";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  variant = "gray",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl",
            variant === "accent" ? "bg-primary/10" : "bg-muted",
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 hover:-translate-y-px"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
