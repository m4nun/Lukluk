"use client";

import Image from "next/image";
import { PawPrint } from "lucide-react";

interface PetProfileHeaderProps {
  petName: string;
  petSpecies?: string;
  petImage?: string | null;
  accentColor?: "emerald" | "blue" | "amber" | "rose" | "violet";
}

const RING_COLORS = {
  emerald: "ring-emerald-200",
  blue: "ring-blue-200",
  amber: "ring-amber-200",
  rose: "ring-rose-200",
  violet: "ring-violet-200",
};

export default function PetProfileHeader({
  petName,
  petSpecies,
  petImage,
  accentColor = "blue",
}: PetProfileHeaderProps) {
  const ringColor = RING_COLORS[accentColor];

  return (
    <div className="flex flex-col items-center pt-5 pb-3 px-4">
      <div className={`relative h-16 w-16 overflow-hidden rounded-full border-[3px] border-white shadow-lg ring-2 ${ringColor}`}>
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
  );
}
