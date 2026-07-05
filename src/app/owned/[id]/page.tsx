"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AgentChat from "@/components/agent/AgentChat";
import type { ChatMessage } from "@/components/agent/AgentChat";
import ExpenseTable from "@/components/workspace/ExpenseTable";
import FoodGuideCard from "@/components/workspace/FoodGuideCard";
import ScheduleCards from "@/components/workspace/ScheduleCards";
import HealthCard from "@/components/workspace/HealthCard";
import EditPetModal from "@/components/workspace/EditPetModal";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { getPetLogo } from "@/lib/pet-logos";
import { ArrowLeft, Edit, MoreVertical, MessageCircle, Home, PawPrint, Receipt, User, Calendar, Heart } from "lucide-react";
import type { FoodCard, ScheduleCard, HealthMetric } from "@/lib/types";

interface OwnedData {
  id: string;
  pet_name: string;
  age_life_stage: string;
  got_date: string | null;
  pet_image?: string | null;
  actual_expenses: Array<{
    category: string;
    item: string;
    amount_thb: number;
    note?: string;
  }>;
  food_guide: FoodCard[] | { brand?: string; amount?: string; frequency?: string; notes?: string } | null;
  schedule: ScheduleCard[] | null;
  health_metrics: HealthMetric[] | null;
  pet_type_profiles: { id: string; name: string; species: string; mbti_label: string };
}

function ageLabel(stage: string) {
  switch (stage) {
    case "puppy/kitten": return "Puppy / Kitten";
    case "young_adult": return "Young Adult";
    case "adult": return "Adult";
    case "senior": return "Senior";
    default: return stage;
  }
}

export default function OwnedPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<OwnedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expenses" | "food" | "schedule" | "health">("expenses");
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ownership/${params.id}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          setError("Could not load pet profile");
        }
      } catch {
        setError("Could not connect. Check your internet connection.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch(`/api/ownership/${params.id}`);
      if (res.ok) setData(await res.json());
    } catch {}
  }, [params.id]);

  const handleEmbedToChat = useCallback((text: string) => {
    setChatInput(text);
    setChatOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex h-[52px] items-center border-b border-gray-200 bg-white px-5">
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
  const totalCost = data.actual_expenses.reduce((sum, e) => sum + e.amount_thb, 0);

  const tabs = [
    { key: "expenses" as const, label: "Actual Expenses" },
    { key: "food" as const, label: "Food Guide" },
    { key: "schedule" as const, label: "Schedule" },
    { key: "health" as const, label: "Health" },
  ];

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
              <Image src={logoSrc} alt={data.pet_name} width={28} height={28} className="object-cover" />
            </div>
          )}
          <span className="text-sm font-semibold">{data.pet_name}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600">
            <PawPrint className="h-3 w-3" fill="currentColor" />
            Owned
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="h-9 w-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <Edit className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="flex md:hidden h-[52px] shrink-0 items-center border-b border-gray-200 bg-white px-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-orange-500 font-medium">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="mx-auto flex items-center gap-2">
          {logoSrc && (
            <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-gray-200">
              <Image src={logoSrc} alt={data.pet_name} width={28} height={28} className="object-cover" />
            </div>
          )}
          <span className="text-[15px] font-semibold">{data.pet_name}</span>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600 border border-green-200">
            <PawPrint className="h-2.5 w-2.5" fill="currentColor" />
            {t.status.owned}
          </span>
        </div>
        <button className="h-9 w-9 rounded-full flex items-center justify-center text-gray-500">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </nav>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 overflow-y-auto">
          {/* Pet Header */}
          <div className="flex items-start gap-4 px-5 pt-5 pb-4 md:px-7 md:pt-7">
            {logoSrc ? (
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-lg">
                <Image src={logoSrc} alt={data.pet_name} width={80} height={80} className="object-cover" />
              </div>
            ) : (
              <div className="h-20 w-20 flex-shrink-0 rounded-2xl border-2 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                <PawPrint className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <div className="text-xl font-bold text-gray-900">{data.pet_name}</div>
              <div className="text-sm text-gray-500 mt-0.5">{data.pet_type_profiles.name} · {ageLabel(data.age_life_stage)}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600 border border-green-200">
                  <PawPrint className="h-3 w-3" fill="currentColor" />
                  Owned
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button onClick={() => setShowEditModal(true)} className="h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors active:scale-95">
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="relative h-9 w-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors active:scale-95">
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                    <button onClick={() => { setShowEditModal(true); setShowMoreMenu(false); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Pet
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 px-5 md:px-7 sticky top-0 bg-[#fafafa] z-10 scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`shrink-0 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                  activeTab === t.key
                    ? "border-orange-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5 pb-24 md:p-7 md:pb-7">
            {activeTab === "expenses" && (
              <ExpenseTable
                expenses={data.actual_expenses}
                variant="ownership"
                onEmbedToChat={handleEmbedToChat}
              />
            )}
            {activeTab === "food" && (
              <FoodGuideCard
                cards={data.food_guide}
                petName={data.pet_name}
                petSpecies={data.pet_type_profiles.name}
                petImage={data.pet_image}
                onReorder={refreshData}
                onRemove={refreshData}
                onAdd={() => {}}
              />
            )}
            {activeTab === "schedule" && (
              <ScheduleCards
                schedules={data.schedule}
                onReorder={refreshData}
                onRemove={async (scheduleId) => {
                  await fetch(`/api/ownership/${params.id}/schedule`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ schedule_id: scheduleId }),
                  });
                  refreshData();
                }}
                onComplete={async (scheduleId) => {
                  await fetch(`/api/ownership/${params.id}/schedule`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ schedule_id: scheduleId, completed: true }),
                  });
                  refreshData();
                }}
                onAdd={() => {}}
              />
            )}
            {activeTab === "health" && (
              <HealthCard
                metrics={data.health_metrics}
                onAdd={async (metric) => {
                  await fetch(`/api/ownership/${params.id}/health`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(metric),
                  });
                  refreshData();
                }}
                onRemove={async (metricId) => {
                  await fetch(`/api/ownership/${params.id}/health`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ metric_id: metricId }),
                  });
                  refreshData();
                }}
              />
            )}
          </div>
        </div>

        {/* Right Panel — Care Chat (Desktop) */}
        <div className="hidden md:flex w-[380px] shrink-0 flex-col bg-white border-l border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Care Agent</h3>
              <p className="text-xs text-gray-500">Help with feeding, schedule, and expenses</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Available
            </div>
          </div>
          <AgentChat
            endpoint="/api/agent/care"
            bodyKey="ownedProfileId"
            profileId={params.id}
            suggestions={["Track an expense", "Feeding tips", "Schedule ideas"]}
            placeholder="Type a message"
            emptyTitle="Hi, I'm the Care Agent"
            emptyDescription="I help with feeding schedules, expense tracking, and pet care questions"
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
      <div className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${chatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setChatOpen(false)} />
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px] flex flex-col transition-transform duration-300 ${chatOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ height: "85dvh" }}>
        <div className="w-9 h-1 rounded-full bg-gray-300 mx-auto mt-2.5 flex-shrink-0" />
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-200 flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold">Care Agent</h3>
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
            endpoint="/api/agent/care"
            bodyKey="ownedProfileId"
            profileId={params.id}
            suggestions={["Track an expense", "Feeding tips"]}
            placeholder="Type a message"
            emptyTitle="Hi, I'm the Care Agent"
            emptyDescription="Schedule ideas"
            onMessageSent={refreshData}
            externalInput={chatInput}
            onExternalInputConsumed={() => setChatInput("")}
            messages={chatMessages}
            onMessagesChange={setChatMessages}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditPetModal
          ownedId={params.id}
          petName={data.pet_name}
          ageLifeStage={data.age_life_stage}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); refreshData(); }}
          onDeleted={() => router.push("/dashboard")}
        />
      )}
    </div>
  );
}
