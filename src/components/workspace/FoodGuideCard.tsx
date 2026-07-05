"use client";

import { useState, useEffect } from "react";
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
import type { FoodCard } from "@/lib/types";
import { Utensils, Scale, Clock, StickyNote, Plus } from "lucide-react";

interface FoodGuideCardProps {
  cards: FoodCard[] | { brand?: string; amount?: string; frequency?: string; notes?: string } | null;
  petName: string;
  petSpecies?: string;
  petImage?: string | null;
  highlight?: boolean;
  onReorder?: (cards: FoodCard[]) => void;
  onRemove?: (id: string) => void;
  onAdd?: () => void;
}

function normalizeCards(input: FoodGuideCardProps["cards"]): FoodCard[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (input.brand || input.amount || input.frequency || input.notes) {
    return [{
      id: "food-1",
      name: "Main Food",
      brand: input.brand || "",
      amount: input.amount || "",
      frequency: input.frequency || "",
      notes: input.notes || null,
    }];
  }
  return [];
}

export default function FoodGuideCard({
  cards,
  petName,
  petSpecies,
  petImage,
  highlight: externalHighlight,
  onReorder,
  onRemove,
  onAdd,
}: FoodGuideCardProps) {
  const [localCards, setLocalCards] = useState<FoodCard[]>(() => normalizeCards(cards));

  useEffect(() => {
    setLocalCards(normalizeCards(cards));
  }, [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const normalized = normalizeCards(cards);

  if (normalized.length === 0) {
    return (
      <EmptyState
        icon={<Utensils className="h-6 w-6" />}
        title="No food guide yet"
        description="Ask the Care Agent for feeding recommendations."
        variant="accent"
      />
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localCards.findIndex((c) => c.id === active.id);
    const newIndex = localCards.findIndex((c) => c.id === over.id);

    const newOrder = arrayMove(localCards, oldIndex, newIndex);
    setLocalCards(newOrder);
    onReorder?.(newOrder);
  }

  function handleRemove(id: string) {
    const newCards = localCards.filter((c) => c.id !== id);
    setLocalCards(newCards);
    onRemove?.(id);
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localCards.map((c) => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {localCards.map((card) => (
            <DeskCard
              key={card.id}
              id={card.id}
              petName={petName}
              petSpecies={petSpecies}
              petImage={petImage}
              accentColor="amber"
              onRemove={() => handleRemove(card.id)}
            >
              <div className="space-y-2.5">
                {/* Food Image */}
                {card.image ? (
                  <div className="relative h-28 w-full overflow-hidden rounded-xl border border-gray-100">
                    <Image
                      src={card.image}
                      alt={card.brand || card.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                ) : (
                  <div className="flex h-20 w-full items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
                    <Utensils className="h-8 w-8 text-amber-500" />
                  </div>
                )}

                {/* Food Info */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 truncate">{card.name}</h4>
                  {card.brand && (
                    <p className="text-xs text-gray-500 truncate">{card.brand}</p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  {card.amount && (
                    <div className="flex items-center gap-2 text-xs">
                      <Scale className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium text-gray-700">{card.amount}</span>
                    </div>
                  )}
                  {card.frequency && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-gray-500">Schedule:</span>
                      <span className="font-medium text-gray-700">{card.frequency}</span>
                    </div>
                  )}
                  {card.notes && (
                    <div className="flex items-start gap-2 text-xs pt-1.5 mt-1.5 border-t border-gray-100">
                      <StickyNote className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-gray-500 leading-relaxed">{card.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </DeskCard>
          ))}

          {/* Add Card Button */}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-6 text-gray-400 hover:border-amber-300 hover:text-amber-600 transition-colors min-h-[200px]"
            >
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">Add Food Card</span>
            </button>
          )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
