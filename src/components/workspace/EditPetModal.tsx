"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface EditPetModalProps {
  ownedId: string;
  petName: string;
  ageLifeStage: string;
  onClose: () => void;
  onSaved: () => void;
}

const AGE_OPTIONS = [
  { value: "puppy/kitten", label: "Puppy / Kitten" },
  { value: "young_adult", label: "Young Adult" },
  { value: "adult", label: "Adult" },
  { value: "senior", label: "Senior" },
];

export default function EditPetModal({
  ownedId,
  petName,
  ageLifeStage,
  onClose,
  onSaved,
}: EditPetModalProps) {
  const [name, setName] = useState(petName);
  const [ageStage, setAgeStage] = useState(ageLifeStage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) {
      setError("Pet name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/ownership/${ownedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pet_name: name.trim(), age_life_stage: ageStage }),
      });
      if (res.ok) {
        onSaved();
      } else {
        setError("Failed to save changes");
      }
    } catch {
      setError("Could not connect. Check your internet connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl bg-white shadow-xl max-w-md mx-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Edit Pet Details</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="pet-name" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Pet Name
            </label>
            <input
              id="pet-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              placeholder="Enter pet name"
            />
          </div>

          <div>
            <label htmlFor="age-stage" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Life Stage
            </label>
            <select
              id="age-stage"
              value={ageStage}
              onChange={(e) => setAgeStage(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 appearance-none"
            >
              {AGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}
