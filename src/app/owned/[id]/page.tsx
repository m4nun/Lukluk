"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CareChat from "@/components/agent/CareChat";

interface OwnedData {
  id: string;
  pet_name: string;
  age_life_stage: string;
  got_date: string | null;
  actual_expenses: Array<{ category: string; item: string; amount_thb: number; note?: string }>;
  activity_schedule: Array<{ day: string; activity: string; time: string }>;
  food_guide: { brand?: string; amount?: string; frequency?: string; notes?: string };
  pet_type_profiles: { name: string };
}

export default function OwnedPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<OwnedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expenses" | "activity" | "food">("expenses");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ownership/${params.id}`);
        if (res.ok) {
          const fetchedData = await res.json();
          setData(fetchedData);
        }
      } catch (e) {
        console.error("Failed to load owned profile", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!data) return null;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Panel — Care Data */}
      <div style={{ flex: 1, overflow: "auto", padding: 24, borderRight: "1px solid #eee" }}>
        <h2>{data.pet_name}</h2>
        <p style={{ color: "#666" }}>
          {data.pet_type_profiles.name} · {data.age_life_stage}
        </p>

        <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          {(["expenses", "activity", "food"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ fontWeight: activeTab === tab ? "bold" : "normal" }}
            >
              {tab === "expenses" ? "Actual Expenses" : tab === "activity" ? "Activity Schedule" : "Food Guide"}
            </button>
          ))}
        </div>

        {activeTab === "expenses" && (
          <div>
            {data.actual_expenses.length === 0 ? (
              <p>No expenses tracked yet. Chat with the Care Agent to start tracking.</p>
            ) : (
              data.actual_expenses.map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span>{e.category}: {e.item}</span>
                  <span>{e.amount_thb.toLocaleString()} THB</span>
                  {e.note && <span style={{ color: "#666", fontSize: 12 }}>{e.note}</span>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            {data.activity_schedule.length === 0 ? (
              <p>No schedule yet. The Care Agent can help build a daily routine.</p>
            ) : (
              data.activity_schedule.map((a, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <strong>{a.day}</strong>: {a.activity} ({a.time})
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "food" && (
          <div>
            {!data.food_guide.brand ? (
              <p>No food guide yet. Chat with the Care Agent for recommendations.</p>
            ) : (
              <div>
                <p><strong>Brand:</strong> {data.food_guide.brand}</p>
                <p><strong>Amount:</strong> {data.food_guide.amount}</p>
                <p><strong>Frequency:</strong> {data.food_guide.frequency}</p>
                {data.food_guide.notes && <p><strong>Notes:</strong> {data.food_guide.notes}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel — Care Agent */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <CareChat ownedProfileId={params.id} />
      </div>
    </div>
  );
}
