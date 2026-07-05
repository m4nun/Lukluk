"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AgentChat from "@/components/agent/AgentChat";
import type { ChatMessage } from "@/components/agent/AgentChat";
import ExpenseTable from "@/components/workspace/ExpenseTable";
import ConcernChecklist from "@/components/workspace/ConcernChecklist";
import DecisionStatus from "@/components/workspace/DecisionStatus";
import DraftPanel from "@/components/workspace/DraftPanel";
import OwnershipForm from "@/components/workspace/OwnershipForm";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { getPetLogo } from "@/lib/pet-logos";
import { ArrowLeft, PawPrint, MessageCircle, Home, Receipt, User, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

interface WorkspaceData {
  id: string;
  planning_name: string | null;
  decision_status: string;
  estimated_expenses: Array<{
    category: string;
    item: string;
    amount_thb: number;
    note?: string;
  }>;
  concern_checklist: Array<{
    concern_id: string;
    title: string;
    status: string;
    note?: string;
    resolved_at?: string;
  }>;
  pet_type_profiles: {
    id: string;
    name: string;
    species: string;
    mbti_label: string;
    description: string;
  };
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
  const { t } = useI18n();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"expenses" | "concerns">("expenses");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [transitionError, setTransitionError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEmbedToChat = useCallback((text: string) => {
    setChatInput(text);
    setChatOpen(true);
  }, []);

  function handleConcernStatusChange(concernId: string, newStatus: string) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        concern_checklist: prev.concern_checklist.map((c) =>
          c.concern_id === concernId
            ? { ...c, status: newStatus, resolved_at: newStatus === "resolved" ? new Date().toISOString() : c.resolved_at }
            : c
        ),
      };
    });
  }

  const allConcernsResolved = data
    ? data.concern_checklist.length > 0 &&
      data.concern_checklist.every((c) => c.status === "resolved" || c.status === "not_applicable")
    : false;

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, [params.id]);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/planning");
      if (res.ok) {
        const profiles = await res.json();
        const profile = profiles.find((p: { id: string }) => p.id === params.id);
        if (profile) setData(profile);
      }
    } catch {}
  }, [params.id]);

  async function handleStatusUpdate(newStatus: string) {
    if (!data) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/planning/${params.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData((prev) => prev ? { ...prev, decision_status: newStatus } : null);
      }
    } catch {}
    finally { setStatusUpdating(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/planning/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {}
    finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleOwnership(petName: string, ageLifeStage: string) {
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
    } catch {
      setTransitionError("Could not connect. Check your internet and try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex h-14 items-center border-b border-gray-200 bg-white px-5">
          <LoadingSkeleton variant="text" rows={1} />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 overflow-auto p-6">
            <LoadingSkeleton variant="card" />
            <div className="mt-6"><LoadingSkeleton variant="table" rows={6} /></div>
          </div>
          <div className="w-[380px] border-l border-gray-200 bg-white" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-6">
        <h2 className="text-xl font-bold">Workspace not found</h2>
        <p className="mt-2 text-gray-500">{error || "This workspace may have been deleted"}</p>
        <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const logoSrc = getPetLogo(data.pet_type_profiles.id);
  const displayName = data.planning_name || data.pet_type_profiles.name;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa]">
      {/* Desktop Nav */}
      <nav className="hidden md:flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Image src="/assets/logo.png" alt="Lukluk" width={24} height={24} />
            Lukluk
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <Link href="/dashboard" className="flex items-center gap-1 text-[13px] text-gray-500 transition-colors hover:text-gray-900 rounded-full px-2.5 py-1 hover:bg-gray-100">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          {logoSrc && (
            <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-gray-200">
              <Image src={logoSrc} alt={displayName} width={28} height={28} className="object-cover" />
            </div>
          )}
          <span className="text-sm font-semibold">{displayName}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-600">
            <PawPrint className="h-3 w-3" fill="currentColor" />
            {STATUS_LABELS[data.decision_status] || data.decision_status}
          </span>
        </div>
        <div className="w-[100px]" />
      </nav>

      {/* Mobile Nav */}
      <nav className="flex md:hidden h-[52px] shrink-0 items-center border-b border-gray-200 bg-white px-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-orange-500 font-medium">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="mx-auto flex items-center gap-2">
          {logoSrc && (
            <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-gray-200">
              <Image src={logoSrc} alt={displayName} width={28} height={28} className="object-cover" />
            </div>
          )}
          <span className="text-[15px] font-semibold">{displayName}</span>
        </div>
        <div className="w-9" />
      </nav>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 overflow-y-auto">
          {/* Pet Header */}
          <div className="flex items-start gap-4 px-5 pt-5 pb-4 md:px-7 md:pt-7">
            {logoSrc ? (
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-lg">
                <Image src={logoSrc} alt={displayName} width={80} height={80} className="object-cover" />
              </div>
            ) : (
              <div className="h-20 w-20 flex-shrink-0 rounded-2xl border-2 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                <PawPrint className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <div className="text-xl font-bold text-gray-900">{displayName}</div>
              <div className="text-sm text-gray-500 mt-0.5">{data.pet_type_profiles.species} · {data.pet_type_profiles.mbti_label}</div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors pt-1"
              title="Remove from workspaces"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Decision Status */}
          <div className="px-5 md:px-7 pb-4">
            <DecisionStatus
              status={data.decision_status}
              onUpdate={handleStatusUpdate}
              disabled={statusUpdating}
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-5 md:px-7 sticky top-0 bg-[#fafafa] z-10">
            <button
              onClick={() => setActiveTab("expenses")}
              className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === "expenses"
                  ? "border-orange-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Estimated Expenses
            </button>
            <button
              onClick={() => setActiveTab("concerns")}
              className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === "concerns"
                  ? "border-orange-500 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Concern Checklist
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5 pb-24 md:p-7 md:pb-7">
            {activeTab === "expenses" ? (
              <ExpenseTable expenses={data.estimated_expenses} onEmbedToChat={handleEmbedToChat} />
            ) : (
              <ConcernChecklist
                concerns={data.concern_checklist}
                onEmbedToChat={handleEmbedToChat}
                onStatusChange={handleConcernStatusChange}
                workspaceId={params.id}
              />
            )}
          </div>

          {/* Drafts */}
          <DraftPanel planningProfileId={params.id} />

          {/* Ownership form */}
          {!data.has_ownership && (
            <div className="px-5 pb-24 md:px-7 md:pb-7">
              <OwnershipForm
                onSubmit={handleOwnership}
                error={transitionError}
                petTypeName={data.pet_type_profiles.name}
              />
            </div>
          )}
        </div>

        {/* Right Panel — Decision Chat (Desktop) */}
        <div className="hidden md:flex w-[380px] shrink-0 flex-col bg-white border-l border-gray-200">
          <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Decision Agent</h3>
              <p className="text-xs text-gray-500">Help with costs, concerns, and lifestyle fit</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Available
            </div>
          </div>
          <AgentChat
            endpoint="/api/agent/chat"
            bodyKey="planningProfileId"
            profileId={params.id}
            suggestions={["Show estimated costs", "Main concerns?", "Does this pet fit my lifestyle?"]}
            placeholder="Type a message"
            emptyTitle="Hi, I'm the Decision Agent"
            emptyDescription="Ask me about costs, concerns, or whether this pet fits your lifestyle"
            onMessageSent={refreshData}
            externalInput={chatInput}
            onExternalInputConsumed={() => setChatInput("")}
            messages={chatMessages}
            onMessagesChange={setChatMessages}
          />
        </div>
      </div>

      {/* Mobile Chat FAB */}
      <button
        onClick={() => setChatOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Mobile Bottom Sheet Chat */}
      {chatOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setChatOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px] flex flex-col" style={{ height: "85dvh" }}>
            <div className="w-9 h-1 rounded-full bg-gray-300 mx-auto mt-2.5 flex-shrink-0" />
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-200 flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold">Decision Agent</h3>
                <p className="text-xs text-gray-500">Always available</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 h-full">
              <AgentChat
                endpoint="/api/agent/chat"
                bodyKey="planningProfileId"
                profileId={params.id}
                suggestions={["Show estimated costs", "Main concerns?"]}
                placeholder="Type a message"
                emptyTitle="Hi, I'm the Decision Agent"
                emptyDescription="Does this pet fit my lifestyle?"
                onMessageSent={refreshData}
                externalInput={chatInput}
                onExternalInputConsumed={() => setChatInput("")}
                messages={chatMessages}
                onMessagesChange={setChatMessages}
              />
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Removing..." : "Remove"}
              </button>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
