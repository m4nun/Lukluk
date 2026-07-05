"use client";

import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";

interface CardWrapperProps {
  id: string;
  accentColor?: "emerald" | "blue" | "amber" | "rose" | "violet";
  isDragging?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  onRemove?: () => void;
  draggable?: boolean;
}

const ACCENT_COLORS = {
  emerald: {
    border: "border-emerald-300",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  blue: {
    border: "border-blue-300",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  amber: {
    border: "border-amber-300",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  rose: {
    border: "border-rose-300",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  violet: {
    border: "border-violet-300",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
};

const CardWrapper = forwardRef<HTMLDivElement, CardWrapperProps>(
  ({ id, accentColor = "blue", isDragging, children, onClick, onRemove, draggable = true }, ref) => {
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
        onClick={onClick}
        className={`
          group relative flex flex-col
          rounded-2xl border-[2.5px] ${colors.border} bg-white
          transition-all duration-200
          ${dragging ? "opacity-50 scale-[1.03] z-50 shadow-2xl" : "opacity-100"}
          ${onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5" : ""}
        `}
      >
        {/* Drag Handle */}
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-gray-200">
              <GripVertical className="h-3 w-3 text-gray-400" />
            </div>
          </button>
        )}

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-900 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    );
  }
);

CardWrapper.displayName = "CardWrapper";

export default CardWrapper;
