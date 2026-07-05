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
  verticalListSortingStrategy,
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
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localActivities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
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
                <div className="space-y-2.5">
                  {/* Activity Image */}
                  {activity.image ? (
                    <div className="relative h-28 w-full overflow-hidden rounded-xl border border-gray-100">
                      <Image
                        src={activity.image}
                        alt={activity.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-20 w-full items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100">
                      <IconComp className="h-8 w-8 text-emerald-500" />
                    </div>
                  )}

                  {/* Activity Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{activity.name}</h4>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DIFFICULTY_STYLES[activity.difficulty] || ""}`}
                      >
                        {activity.difficulty}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {activity.duration} · {activity.frequency}
                    </p>
                    {activity.notes && (
                      <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                </div>
              </DeskCard>
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}
