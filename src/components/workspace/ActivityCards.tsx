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
import CardWrapper from "./CardWrapper";
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
  easy: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border border-amber-200",
  hard: "bg-rose-100 text-rose-700 border border-rose-200",
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

  if (activities == null) {
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
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localActivities.map((a) => a.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {localActivities.map((activity) => {
              const IconComp = getActivityIcon(activity.icon);
              return (
                <CardWrapper
                  key={activity.id}
                  id={activity.id}
                  accentColor="emerald"
                  onRemove={() => handleRemove(activity.id)}
                >
                  {/* Illustration / Icon */}
                  {activity.image ? (
                    <div className="relative h-32 w-full overflow-t-xl">
                      <Image
                        src={activity.image}
                        alt={activity.name}
                        fill
                        className="object-cover rounded-t-xl"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center rounded-t-xl bg-emerald-50 border-b border-emerald-100">
                      <IconComp className="h-10 w-10 text-emerald-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{activity.name}</h4>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFFICULTY_STYLES[activity.difficulty] || ""}`}
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
                </CardWrapper>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
