"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ChatMessage } from "@/components/agent/AgentChat";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import ExpenseTable from "@/components/workspace/ExpenseTable";
import FoodGuideCard from "@/components/workspace/FoodGuideCard";
import ScheduleCards from "@/components/workspace/ScheduleCards";
import HealthCard from "@/components/workspace/HealthCard";
import EditPetModal from "@/components/workspace/EditPetModal";
import { getPetLogo } from "@/lib/pet-logos";
import { Edit, MoreVertical } from "lucide-react";
import type { FoodCard, ScheduleCard, HealthMetric } from "@/lib/types";

interface OwnedData {
  id: string;
  pet_name: string;
  age_life_stage: string;
  got_date: string | null;
  pet_image?: string | null;
  actual_expenses: { category: string; item: string; amount_thb: number; note?: string }[];
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
  const [activeTab, setActiveTab] = useState<string>("expenses");
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/ownership/${params.id}`);
        if (res.ok) setData(await res.json());
        else setError("Could not load pet profile");
      } catch { setError("Could not connect. Check your internet connection."); }
      finally { setLoading(false); }
    })();
  }, [params.id]);

  const refreshData = useCallback(async () => {
    try { const res = await fetch(`/api/ownership/${params.id}`); if (res.ok) setData(await res.json()); } catch {}
  }, [params.id]);

  const handleScheduleRemove = useCallback(async (scheduleId: string) => {
    await fetch(`/api/ownership/${params.id}/schedule`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule_id: scheduleId }),
    });
    refreshData();
  }, [params.id, refreshData]);

  const handleScheduleComplete = useCallback(async (scheduleId: string) => {
    await fetch(`/api/ownership/${params.id}/schedule`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule_id: scheduleId, completed: true }),
    });
    refreshData();
  }, [params.id, refreshData]);

  const handleHealthAdd = useCallback(async (metric: unknown) => {
    await fetch(`/api/ownership/${params.id}/health`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metric),
    });
    refreshData();
  }, [params.id, refreshData]);

  const handleHealthRemove = useCallback(async (metricId: string) => {
    await fetch(`/api/ownership/${params.id}/health`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric_id: metricId }),
    });
    refreshData();
  }, [params.id, refreshData]);

  const logoSrc = data ? getPetLogo(data.pet_type_profiles.id) : null;

  return (
    <>
      <WorkspaceLayout
        profileId={params.id}
        petName={data?.pet_name || ""}
        logoSrc={logoSrc}
        badgeLabel="Owned"
        badgeClass="bg-green-50 text-green-600 border-green-200"
        tabs={[
          { key: "expenses", label: "Actual Expenses" },
          { key: "food", label: "Food Guide" },
          { key: "schedule", label: "Schedule" },
          { key: "health", label: "Health" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        chat={{
          endpoint: "/api/agent/care",
          bodyKey: "ownedProfileId",
          suggestions: ["Track an expense", "Feeding tips", "Vets near me", "Schedule ideas"],
          placeholder: "Ask about feeding, schedules, expenses, or nearby vets...",
          emptyTitle: "Care Agent",
          emptyDescription: "Help with feeding, schedule, and expenses",
          onMessageSent: refreshData,
          messages: chatMessages,
          onMessagesChange: setChatMessages,
          chatInput,
          onChatInputConsumed: () => setChatInput(""),
        }}
        chatOpen={chatOpen}
        onChatToggle={setChatOpen}
        headerActions={
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
        }
        loading={loading}
        error={error}
      >
        {data && activeTab === "expenses" && (
          <ExpenseTable expenses={data.actual_expenses} variant="ownership" onEmbedToChat={(text) => { setChatInput(text); setChatOpen(true); }} />
        )}
        {data && activeTab === "food" && (
          <FoodGuideCard
            cards={data.food_guide as never}
            petName={data.pet_name}
            petSpecies={data.pet_type_profiles.name}
            petImage={data.pet_image ?? null}
            onReorder={refreshData}
            onRemove={refreshData}
            onAdd={() => {}}
          />
        )}
        {data && activeTab === "schedule" && (
          <ScheduleCards schedules={data.schedule} onReorder={refreshData} onRemove={handleScheduleRemove} onComplete={handleScheduleComplete} onAdd={() => {}} />
        )}
        {data && activeTab === "health" && (
          <HealthCard metrics={data.health_metrics} onAdd={handleHealthAdd} onRemove={handleHealthRemove} />
        )}
      </WorkspaceLayout>

      {showEditModal && data && (
        <EditPetModal
          ownedId={params.id}
          petName={data.pet_name}
          ageLifeStage={data.age_life_stage}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); refreshData(); }}
          onDeleted={() => router.push("/dashboard")}
        />
      )}
    </>
  );
}
