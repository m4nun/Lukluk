"use client";

import { cn } from "@/lib/utils";

type SkeletonVariant = "page" | "card" | "table" | "text";

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = "text",
  rows = 3,
  className,
}: LoadingSkeletonProps) {
  if (variant === "page") {
    return (
      <div className={cn("max-w-sm animate-shimmer rounded-xl", className)}>
        <div className="mb-3 h-6 w-3/5 rounded-md bg-muted" />
        <div className="mb-2 h-4 w-full rounded-md bg-muted" />
        <div className="mb-2 h-4 w-4/5 rounded-md bg-muted" />
        <div className="mt-4 h-10 w-28 rounded-full bg-muted" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-5",
          className,
        )}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-3 animate-pulse rounded-md bg-muted"
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <div className="h-4 flex-[2] animate-pulse rounded bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded-md bg-muted"
          style={{ width: `${60 + Math.random() * 40}%` }}
        />
      ))}
    </div>
  );
}
