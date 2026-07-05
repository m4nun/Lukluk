"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface DeletePetModalProps {
  ownedId: string;
  petName: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeletePetModal({
  ownedId,
  petName,
  onClose,
  onDeleted,
}: DeletePetModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isConfirm = confirmText === petName;

  async function handleDelete() {
    if (!isConfirm) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/ownership/${ownedId}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
      } else {
        setError("Failed to delete. Please try again.");
      }
    } catch {
      setError("Could not connect. Check your internet connection.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl bg-white shadow-xl max-w-md mx-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Delete Pet</h2>
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

          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">This action cannot be undone</p>
              <p className="mt-1 text-[13px] text-red-600">
                This will permanently delete <strong>{petName}</strong> and all associated data including expenses, activities, food guide, and chat history.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-name" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Type <span className="text-red-600">{petName}</span> to confirm
            </label>
            <input
              id="confirm-name"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
              placeholder={petName}
            />
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
            onClick={handleDelete}
            disabled={!isConfirm || deleting}
            className="px-5 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete Pet"}
          </button>
        </div>
      </div>
    </>
  );
}
