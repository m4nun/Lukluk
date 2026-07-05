"use client";

import { useState } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

interface EditPetModalProps {
  ownedId: string;
  petName: string;
  ageLifeStage: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
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
  onDeleted,
}: EditPetModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState(petName);
  const [ageStage, setAgeStage] = useState(ageLifeStage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const isConfirm = confirmText === petName;

  async function handleSave() {
    if (!name.trim()) {
      setError(t.editPet.nameRequired);
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
        setError(t.editPet.failedToSave);
      }
    } catch {
      setError(t.editPet.checkConnection);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isConfirm) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/ownership/${ownedId}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
      } else {
        setDeleteError(t.editPet.failedToDelete);
      }
    } catch {
      setDeleteError("Could not connect. Check your internet connection.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-4 top-[10%] z-50 max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-xl max-w-md mx-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">{t.editPet.title}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Edit Form */}
        <div className="px-5 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="pet-name" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              {t.editPet.petName}
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
              {t.editPet.lifeStage}
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

        {/* Save Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t.editPet.saving : t.editPet.saveChanges}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="border-t-2 border-red-100 bg-red-50/50 px-5 py-5 rounded-b-2xl">
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {t.editPet.deleteThisPet}
            </button>
          ) : (
            <div className="space-y-4">
              {deleteError && (
                <div className="rounded-lg bg-red-100 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {deleteError}
                </div>
              )}

              <div className="flex items-start gap-3 rounded-xl bg-white border border-red-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-800">{t.editPet.cannotUndo}</p>
                  <p className="mt-1 text-[13px] text-red-600">
                    {t.editPet.deleteWarning.replace("{name}", petName)}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-name" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  {t.editPet.typeToConfirm.replace("{name}", petName)}
                </label>
                <input
                  id="confirm-name"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder={petName}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowDelete(false); setConfirmText(""); setDeleteError(""); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!isConfirm || deleting}
                  className="px-5 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? t.editPet.deleting : t.workspace.deletePet}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
