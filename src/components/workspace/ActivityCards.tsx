"use client";

import { EmptyState } from "@/components/layout/EmptyState";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { useHighlight } from "@/hooks/use-highlight";
import type { ActivityInterest } from "@/lib/types";
import {
  Mountain,
  Waves,
  CircleDot,
  Footprints,
  TreePalm,
  Trees,
  GraduationCap,
  Scissors,
  Dog,
  Car,
  Dumbbell,
  Heart,
  Gamepad2,
  Leaf,
} from "lucide-react";

interface ActivityCardsProps {
  activities: ActivityInterest[] | null;
  highlight?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  mountain: Mountain,
  waves: Waves,
  ball: CircleDot,
  running: Footprints,
  beach: TreePalm,
  park: Trees,
  training: GraduationCap,
  grooming: Scissors,
  dog_park: Dog,
  road_trip: Car,
  exercise: Dumbbell,
  play: Gamepad2,
  nature: Leaf,
  default: Heart,
};

function getActivityIcon(icon: string) {
  return ICON_MAP[icon] || ICON_MAP.default;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  medium: "bg-amber-50 text-amber-700 border-amber-200/60",
  hard: "bg-rose-50 text-rose-700 border-rose-200/60",
};

export default function ActivityCards({ activities, highlight: externalHighlight }: ActivityCardsProps) {
  const internalHighlight = useHighlight(activities);
  const isHighlighted = externalHighlight ?? internalHighlight;

  if (activities === null) {
    return <LoadingSkeleton variant="card" />;
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-6 w-6" />}
        title="No activities yet"
        description="Ask the Care Agent about activities your pet enjoys."
        variant="accent"
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3 transition-all duration-500 ${
        isHighlighted ? "bg-primary/10 ring-2 ring-primary/30 shadow-lg shadow-primary/10 rounded-lg p-3 -m-3" : ""
      }`}
    >
      {activities.map((activity, i) => {
        const IconComp = getActivityIcon(activity.icon);
        return (
          <div
            key={i}
            className="flex flex-col rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <IconComp className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold truncate">{activity.name}</h4>
                  <span
                    className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_STYLES[activity.difficulty] || ""}`}
                  >
                    {activity.difficulty}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {activity.duration} · {activity.frequency}
                </p>
              </div>
            </div>
            {activity.notes && (
              <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                {activity.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
