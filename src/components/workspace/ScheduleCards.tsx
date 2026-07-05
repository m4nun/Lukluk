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
import type { ScheduleCard as ScheduleCardType, ScheduleEventType } from "@/lib/types";
import {
  Syringe,
  Stethoscope,
  Scissors,
  Pill,
  Building2,
  AlertTriangle,
  Calendar,
  Check,
  Plus,
} from "lucide-react";

interface ScheduleCardsProps {
  schedules: ScheduleCardType[] | null;
  onReorder?: (schedules: ScheduleCardType[]) => void;
  onRemove?: (id: string) => void;
  onComplete?: (id: string) => void;
  onAdd?: () => void;
}

const EVENT_TYPE_CONFIG: Record<ScheduleEventType, { icon: React.ComponentType<{ className?: string }>; color: string; label: string; bgClass: string; textClass: string; borderClass: string }> = {
  vaccine: { icon: Syringe, color: "blue", label: "VACCINE", bgClass: "bg-blue-50", textClass: "text-blue-600", borderClass: "border-blue-100" },
  checkup: { icon: Stethoscope, color: "emerald", label: "CHECKUP", bgClass: "bg-emerald-50", textClass: "text-emerald-600", borderClass: "border-emerald-100" },
  grooming: { icon: Scissors, color: "amber", label: "GROOMING", bgClass: "bg-amber-50", textClass: "text-amber-600", borderClass: "border-amber-100" },
  medication: { icon: Pill, color: "rose", label: "MEDICATION", bgClass: "bg-rose-50", textClass: "text-rose-600", borderClass: "border-rose-100" },
  boarding: { icon: Building2, color: "violet", label: "BOARDING", bgClass: "bg-violet-50", textClass: "text-violet-600", borderClass: "border-violet-100" },
  emergency: { icon: AlertTriangle, color: "rose", label: "EMERGENCY", bgClass: "bg-rose-50", textClass: "text-rose-600", borderClass: "border-rose-100" },
  other: { icon: Calendar, color: "gray", label: "OTHER", bgClass: "bg-gray-50", textClass: "text-gray-600", borderClass: "border-gray-100" },
};

function getStatus(schedule: ScheduleCardType): { label: string; color: string } {
  if (schedule.completed_date) {
    return { label: "Done", color: "text-green-600 bg-green-50 border border-green-200" };
  }
  const now = new Date();
  const scheduleDate = new Date(schedule.date);
  if (scheduleDate < now) {
    return { label: "Overdue", color: "text-red-600 bg-red-50 border border-red-200" };
  }
  return { label: "Upcoming", color: "text-blue-600 bg-blue-50 border border-blue-200" };
}

function getRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
  return `In ${Math.ceil(diffDays / 30)} months`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ACCENT_COLORS: Record<string, "emerald" | "blue" | "amber" | "rose" | "violet"> = {
  blue: "blue",
  emerald: "emerald",
  amber: "amber",
  rose: "rose",
  violet: "violet",
  gray: "blue",
};

export default function ScheduleCards({
  schedules,
  onReorder,
  onRemove,
  onComplete,
  onAdd,
}: ScheduleCardsProps) {
  const [localSchedules, setLocalSchedules] = useState<ScheduleCardType[]>(schedules || []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (schedules === null) {
    return <LoadingSkeleton variant="card" />;
  }

  if (schedules.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-6 w-6" />}
        title="No schedules yet"
        description="Ask the Care Agent to set up vaccine appointments, grooming sessions, or checkups."
        variant="accent"
      />
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localSchedules.findIndex((s) => s.id === active.id);
    const newIndex = localSchedules.findIndex((s) => s.id === over.id);

    const newOrder = arrayMove(localSchedules, oldIndex, newIndex);
    setLocalSchedules(newOrder);
    onReorder?.(newOrder);
  }

  function handleRemove(id: string) {
    const newSchedules = localSchedules.filter((s) => s.id !== id);
    setLocalSchedules(newSchedules);
    onRemove?.(id);
  }

  // Sort: overdue first, then upcoming by date, then done at the end
  const sortedSchedules = [...localSchedules].sort((a, b) => {
    if (a.completed_date && !b.completed_date) return 1;
    if (!a.completed_date && b.completed_date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedSchedules.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedSchedules.map((schedule) => {
              const config = EVENT_TYPE_CONFIG[schedule.event_type];
              const IconComp = config.icon;
              const accentColor = ACCENT_COLORS[config.color];
              const status = getStatus(schedule);
              const isDone = !!schedule.completed_date;

              return (
                <CardWrapper
                  key={schedule.id}
                  id={schedule.id}
                  accentColor={accentColor}
                  onRemove={() => handleRemove(schedule.id)}
                >
                  {/* Illustration / Icon */}
                  {schedule.illustration ? (
                    <div className="relative h-32 w-full">
                      <Image
                        src={schedule.illustration}
                        alt={schedule.title}
                        fill
                        className="object-cover rounded-t-xl"
                      />
                    </div>
                  ) : (
                    <div className={`flex h-28 w-full items-center justify-center rounded-t-xl ${config.bgClass} border-b ${config.borderClass}`}>
                      <IconComp className={`h-10 w-10 ${config.textClass}`} />
                    </div>
                  )}

                  {/* Content */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold tracking-wide ${config.textClass}`}>
                        {config.label}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <h4 className="mt-2 text-sm font-bold text-gray-900 truncate">{schedule.title}</h4>

                    <div className="mt-1.5 space-y-1">
                      <p className="text-xs text-gray-500">{formatDate(schedule.date)}</p>
                      {!isDone && (
                        <p className={`text-xs font-medium ${status.label === "Overdue" ? "text-red-500" : "text-blue-500"}`}>
                          {getRelativeDate(schedule.date)}
                        </p>
                      )}
                      {schedule.recurring && (
                        <p className="text-[11px] text-gray-400">Repeats every {schedule.recurrence_days} days</p>
                      )}
                    </div>

                    {schedule.notes && (
                      <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2 border-t border-gray-100 pt-2">
                        {schedule.notes}
                      </p>
                    )}

                    {/* Complete Button */}
                    {!isDone && onComplete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onComplete(schedule.id); }}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark Done
                      </button>
                    )}
                  </div>
                </CardWrapper>
              );
            })}

            {/* Add Card Button */}
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-6 text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors min-h-[200px]"
              >
                <Plus className="h-8 w-8" />
                <span className="text-sm font-medium">Add Schedule</span>
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
