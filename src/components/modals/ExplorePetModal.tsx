"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { X, Search, PawPrint } from "lucide-react";
import { getPetLogo } from "@/lib/pet-logos";

interface PetType {
  id: string;
  name: string;
  species: string;
  breed_or_category: string;
  mbti_label: string;
}

interface ExplorePetModalProps {
  onClose: () => void;
  onSelect: (slug: string) => void;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
  rabbit: "🐇",
  bird: "🐦",
  fish: "🐟",
  reptile: "🦎",
  small_mammal: "🐹",
  other: "🐾",
};

export function ExplorePetModal({ onClose, onSelect }: ExplorePetModalProps) {
  const [pets, setPets] = useState<PetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);

  useEffect(() => {
    async function loadPets() {
      try {
        const res = await fetch("/api/pet");
        if (res.ok) {
          const data = await res.json();
          setPets(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadPets();
  }, []);

  const speciesList = useMemo(() => {
    const species = new Set(pets.map((p) => p.species));
    return Array.from(species);
  }, [pets]);

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const matchesSearch =
        !search ||
        pet.name.toLowerCase().includes(search.toLowerCase()) ||
        pet.breed_or_category.toLowerCase().includes(search.toLowerCase()) ||
        pet.species.toLowerCase().includes(search.toLowerCase());

      const matchesSpecies = !selectedSpecies || pet.species === selectedSpecies;

      return matchesSearch && matchesSpecies;
    });
  }, [pets, search, selectedSpecies]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex h-[85vh] w-full max-w-[560px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-gray-900">Explore Pets</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, species, or breed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              autoFocus
            />
          </div>

          {/* Species filter */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedSpecies(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !selectedSpecies
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {speciesList.map((species) => (
              <button
                key={species}
                onClick={() => setSelectedSpecies(selectedSpecies === species ? null : species)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedSpecies === species
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {SPECIES_EMOJI[species] || "🐾"} {species.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Pet list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="mt-3 text-sm text-gray-500">Loading pets...</p>
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PawPrint className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">No pets found</p>
              <p className="mt-1 text-xs text-gray-500">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {filteredPets.map((pet) => {
                const logoSrc = getPetLogo(pet.id);
                return (
                  <button
                    key={pet.id}
                    onClick={() => onSelect(pet.id)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-orange-200"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 overflow-hidden">
                      {logoSrc ? (
                        <Image
                          src={logoSrc}
                          alt={pet.name}
                          width={56}
                          height={56}
                          className="object-cover"
                        />
                      ) : (
                        <PawPrint className="h-6 w-6 text-orange-300" />
                      )}
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">
                        {pet.name}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-gray-500 capitalize">
                        {pet.species.replace("_", " ")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 text-center">
          <p className="text-xs text-gray-500">
            {filteredPets.length} pet{filteredPets.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>
    </div>
  );
}
