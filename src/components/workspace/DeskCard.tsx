"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PawPrint, X } from "lucide-react";

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
    ring: "ring-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    removeBg: "bg-emerald-500",
  },
  blue: {
    ring: "ring-blue-200",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    removeBg: "bg-blue-500",
  },
  amber: {
    ring: "ring-amber-200",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    removeBg: "bg-amber-500",
  },
  rose: {
    ring: "ring-rose-200",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    removeBg: "bg-rose-500",
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
          group relative flex flex-col
          rounded-2xl border border-white/60 bg-white
          shadow-[0_2px_12px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)]
          transition-all duration-200
          ${dragging ? "opacity-60 scale-[1.03] z-50 shadow-2xl" : "opacity-100"}
          hover:shadow-[0_8px_24px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)] hover:-translate-y-1
        `}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-gray-200">
            <GripVertical className="h-3 w-3 text-gray-400" />
          </div>
        </button>

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-900 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Pet Profile Header */}
        <div className="flex flex-col items-center pt-5 pb-3 px-4">
          <div className={`relative h-16 w-16 overflow-hidden rounded-full border-[3px] border-white shadow-lg ring-2 ${colors.ring}`}>
            {petImage ? (
              <Image
                src={petImage}
                alt={petName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <PawPrint className="h-7 w-7 text-gray-400" />
              </div>
            )}
          </div>
          <div className="mt-2.5 text-center">
            <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">{petName}</p>
            {petSpecies && (
              <p className="text-[11px] text-gray-500 capitalize">{petSpecies}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 flex-1">
          {children}
        </div>
      </div>
    );
  }
);

DeskCard.displayName = "DeskCard";

export default DeskCard;
