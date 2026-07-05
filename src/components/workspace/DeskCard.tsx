"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PawPrint } from "lucide-react";

interface DeskCardProps {
  id: string;
  petName: string;
  petSpecies?: string;
  petImage?: string | null;
  accentColor?: "emerald" | "blue" | "amber" | "rose";
  isDragging?: boolean;
  children: React.ReactNode;
  onRemove?: () => void;
}

const ACCENT_COLORS = {
  emerald: {
    bg: "bg-emerald-50/80",
    border: "border-emerald-200/60",
    headerBg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  blue: {
    bg: "bg-blue-50/80",
    border: "border-blue-200/60",
    headerBg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  amber: {
    bg: "bg-amber-50/80",
    border: "border-amber-200/60",
    headerBg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  rose: {
    bg: "bg-rose-50/80",
    border: "border-rose-200/60",
    headerBg: "bg-rose-50",
    dot: "bg-rose-500",
  },
};

const DeskCard = forwardRef<HTMLDivElement, DeskCardProps>(
  ({ id, petName, petSpecies, petImage, accentColor = "emerald", isDragging, children, onRemove }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: isSortableDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const colors = ACCENT_COLORS[accentColor];
    const dragging = isDragging || isSortableDragging;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          group relative rounded-2xl border shadow-lg
          transition-all duration-200
          ${colors.border} ${colors.bg}
          ${dragging ? "opacity-50 scale-105 z-50" : "opacity-100"}
          hover:shadow-xl hover:-translate-y-0.5
        `}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-border">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </button>

        {/* Header with Pet Info */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-t-2xl ${colors.headerBg} border-b ${colors.border}`}>
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm">
            {petImage ? (
              <Image
                src={petImage}
                alt={petName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10">
                <PawPrint className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{petName}</p>
            {petSpecies && (
              <p className="text-xs text-muted-foreground truncate">{petSpecies}</p>
            )}
          </div>
          <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          {children}
        </div>

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
          >
            ×
          </button>
        )}
      </div>
    );
  }
);

DeskCard.displayName = "DeskCard";

export default DeskCard;
