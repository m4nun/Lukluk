"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ChatMessage } from "@/components/agent/AgentChat";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import ExpenseTable from "@/components/workspace/ExpenseTable";
import ConcernChecklist from "@/components/workspace/ConcernChecklist";
import DraftPanel from "@/components/workspace/DraftPanel";
import GuidanceGate from "@/components/workspace/GuidanceGate";
import OwnershipForm from "@/components/workspace/OwnershipForm";
import { getPetLogo } from "@/lib/pet-logos";
import { Trash2 } from "lucide-react";

interface WorkspaceData {
  id: string;
  planning_name: string | null;
  decision_status: "exploring" | "considering" | "ready_to_buy" | "not_a_fit" | "already_have";
  estimated_expenses: { category: string; item: string; amount_thb: number; note?: string }[];
  concern_checklist: { concern_id: string; title: string; status: string; note?: string; resolved_at?: string }[];
  pet_type_profiles: { id: string; name: string; species: string; mbti_label: string; description: string };
  has_ownership: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  exploring: "Exploring",
  considering: "Considering",
  ready_to_buy: "Ready to Buy",
  not_a_fit: "Not a Fit",
  already_have: "Already Have",
};

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"expenses" | "concerns">("expenses");
  const [visitedTabs, setVisitedTabs] = useState<Set<"expenses" | "concerns">>(new Set(["expenses"]));
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [transitionError, setTransitionError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as "expenses" | "concerns");
    setVisitedTabs((prev) => {
      if (prev.has(tab as "expenses" | "concerns")) return prev;
      const next = new Set(prev);
      next.add(tab as "expenses" | "concerns");
      return next;
    });
  }, []);

  const handleEmbedToChat = useCallback((text: string) => {
    setChatInput(text);
    setChatOpen(true);
  }, []);

  const handleConcernStatusChange = useCallback((concernId: string, newStatus: string) => {
    setData((prev) => prev ? {
      ...prev,
      concern_checklist: prev.concern_checklist.map((c) =>
        c.concern_id === concernId
          ? { ...c, status: newStatus, resolved_at: newStatus === "resolved" ? new Date().toISOString() : c.resolved_at }
          : c
      ),
    } : null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/planning");
        if (!res.ok) throw new Error("Failed to load");
        const profiles = await res.json();
        const profile = profiles.find((p: { id: string }) => p.id === params.id);
        if (!profile) throw new Error("Workspace not found");
        setData(profile);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error loading workspace");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/planning");
      if (res.ok) {
        const profiles = await res.json();
        const profile = profiles.find((p: { id: string }) => p.id === params.id);
        if (profile) setData(profile);
      }
    } catch { /* ignore */ }
  }, [params.id]);

  const handleStatusUpdate = useCallback(async (newStatus: string) => {
    if (!data) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/planning/${params.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData((prev) => prev ? { ...prev, decision_status: newStatus as WorkspaceData["decision_status"] } : null);
      }
    } catch { /* ignore */ }
    finally { setStatusUpdating(false); }
  }, [params.id, data]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/planning/${params.id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard");
    } catch { /* ignore */ }
    finally { setDeleting(false); setShowDeleteConfirm(false); }
  }, [params.id, router]);

  const handleOwnership = useCallback(async (petName: string, ageLifeStage: string) => {
    setTransitionError("");
    try {
      const res = await fetch("/api/ownership/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planningProfileId: params.id, petName, ageLifeStage }),
      });
      if (res.ok) {
        const result = await res.json();
        router.push(`/owned/${result.ownedProfileId}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setTransitionError(err.message || "Failed to switch to ownership");
      }
    } catch { setTransitionError("Could not connect. Check your internet and try again."); }
  }, [params.id, router]);

  const displayName = data?.planning_name || data?.pet_type_profiles.name || "";
  const logoSrc = data ? getPetLogo(data.pet_type_profiles.id) : null;

  return (
    <>
      <WorkspaceLayout
        profileId={params.id}
        petName={displayName}
        logoSrc={logoSrc}
        badgeLabel={data ? (STATUS_LABELS[data.decision_status] || data.decision_status) : ""}
        tabs={[
          { key: "expenses", label: "Expenses" },
          { key: "concerns", label: "Concerns" },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        chat={{
          endpoint: "/api/agent/chat",
          bodyKey: "planningProfileId",
          suggestions: ["Show estimated costs", "Main concerns?", "Pet shops near me", "Is this pet right for me?"],
          placeholder: "Ask about costs, concerns, or nearby pet shops...",
          emptyTitle: "Decision Agent",
          emptyDescription: "Help with costs, concerns, and lifestyle fit",
          onMessageSent: refreshData,
          messages: chatMessages,
          onMessagesChange: setChatMessages,
          chatInput,
          onChatInputConsumed: () => setChatInput(""),
        }}
        chatOpen={chatOpen}
        onChatToggle={setChatOpen}
        headerActions={data ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-500">Status:</span>
              <select
                value={data.decision_status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={statusUpdating}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:border-gray-300 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50 cursor-pointer"
              >
                <option value="exploring">Exploring</option>
                <option value="considering">Considering</option>
                <option value="ready_to_buy">Ready to Buy</option>
                <option value="not_a_fit">Not a Fit</option>
                <option value="already_have">Already Have</option>
              </select>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove from workspaces"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : undefined}
        loading={loading}
        error={error}
      >
        {data && activeTab === "expenses" && (
          <ExpenseTable expenses={data.estimated_expenses} onEmbedToChat={handleEmbedToChat} />
        )}
        {data && activeTab === "concerns" && (
          <ConcernChecklist
            concerns={data.concern_checklist}
            onEmbedToChat={handleEmbedToChat}
            onStatusChange={handleConcernStatusChange}
            workspaceId={params.id}
          />
        )}
        {data && (
          <>
            <div className="mt-6">
              <GuidanceGate
                hasSeenExpenses={visitedTabs.has("expenses")}
                hasSeenConcerns={visitedTabs.has("concerns")}
                expenseCount={data.estimated_expenses.length}
                concernCount={data.concern_checklist.length}
                onRequestHelp={() => { setChatInput("Help me with adoption guidance"); setChatOpen(true); }}
              />
            </div>
            <div className="mt-6">
              <DraftPanel planningProfileId={params.id} />
            </div>
            {!data.has_ownership && (
              <div className="mt-6">
                <OwnershipForm
                  onSubmit={handleOwnership}
                  error={transitionError}
                  petTypeName={data.pet_type_profiles.name}
                />
              </div>
            )}
          </>
        )}
      </WorkspaceLayout>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && data && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-x-4 top-[20%] z-50 rounded-2xl bg-white shadow-xl max-w-sm mx-auto">
            <div className="px-5 py-5">
              <h3 className="text-base font-bold text-gray-900">Remove {displayName}?</h3>
              <p className="mt-2 text-sm text-gray-500">
                This will remove the pet from your workspaces. You can explore it again later.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="px-5 py-2 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
