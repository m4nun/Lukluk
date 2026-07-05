"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { EmptyState } from "@/components/layout/EmptyState";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import DeskCard from "./DeskCard";
import type { ActivityCard } from "@/lib/types";
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
  Image as ImageIcon,
} from "lucide-react";

interface ActivityCardsProps {
  activities: ActivityCard[] | null;
  petName: string;
  petSpecies?: string;
  petImage?: string | null;
  highlight?: boolean;
  onReorder?: (activities: ActivityCard[]) => void;
  onRemove?: (id: string) => void;
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
  easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function ActivityCards({
  activities,
  petName,
  petSpecies,
  petImage,
  highlight: externalHighlight,
  onReorder,
  onRemove,
}: ActivityCardsProps) {
  const [localActivities, setLocalActivities] = useState<ActivityCard[]>(activities || []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localActivities.findIndex((a) => a.id === active.id);
    const newIndex = localActivities.findIndex((a) => a.id === over.id);

    const newOrder = arrayMove(localActivities, oldIndex, newIndex);
    setLocalActivities(newOrder);
    onReorder?.(newOrder);
  }

  function handleRemove(id: string) {
    const newActivities = localActivities.filter((a) => a.id !== id);
    setLocalActivities(newActivities);
    onRemove?.(id);
  }

  return (
    <div className="bg-gradient-to-br from-amber-50/50 via-stone-50/30 to-neutral-50/50 rounded-xl p-4 min-h-[200px]">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localActivities.map((a) => a.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {localActivities.map((activity) => {
              const IconComp = getActivityIcon(activity.icon);
              return (
                <DeskCard
                  key={activity.id}
                  id={activity.id}
                  petName={petName}
                  petSpecies={petSpecies}
                  petImage={petImage}
                  accentColor="emerald"
                  onRemove={() => handleRemove(activity.id)}
                >
                  <div className="flex items-start gap-3">
                    {activity.image ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
                        <Image
                          src={activity.image}
                          alt={activity.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <IconComp className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold truncate">{activity.name}</h4>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_STYLES[activity.difficulty] || ""}`}
                        >
                          {activity.difficulty}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {activity.duration} · {activity.frequency}
                      </p>
                    </div>
                  </div>
                  {activity.notes && (
                    <p className="mt-3 text-xs text-muted-foreground border-t border-border/50 pt-2">
                      {activity.notes}
                    </p>
                  )}
                </DeskCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
