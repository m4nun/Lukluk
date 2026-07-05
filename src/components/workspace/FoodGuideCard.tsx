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
import type { FoodCard } from "@/lib/types";
import { Utensils, Scale, Clock, StickyNote, Plus } from "lucide-react";

interface FoodGuideCardProps {
  cards: FoodCard[];
  petName: string;
  petSpecies?: string;
  petImage?: string | null;
  highlight?: boolean;
  onReorder?: (cards: FoodCard[]) => void;
  onRemove?: (id: string) => void;
  onAdd?: () => void;
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
  const [localCards, setLocalCards] = useState<FoodCard[]>(cards);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (cards.length === 0) {
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
    <div className="bg-gradient-to-br from-amber-50/50 via-stone-50/30 to-neutral-50/50 rounded-xl p-4 min-h-[200px]">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localCards.map((c) => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {/* Card Title */}
                <div className="flex items-center gap-2 mb-3">
                  {card.image ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border">
                      <Image
                        src={card.image}
                        alt={card.brand}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      <Utensils className="h-5 w-5 text-amber-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold truncate">{card.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{card.brand}</p>
                  </div>
                </div>

                {/* Card Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{card.amount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Schedule:</span>
                    <span className="font-medium">{card.frequency}</span>
                  </div>
                  {card.notes && (
                    <div className="flex items-start gap-2 text-xs pt-2 border-t border-border/50">
                      <StickyNote className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{card.notes}</span>
                    </div>
                  )}
                </div>
              </DeskCard>
            ))}

            {/* Add Card Button */}
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-white/50 p-6 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors min-h-[180px]"
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
