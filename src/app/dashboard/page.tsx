"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PlanningProfile {
  id: string;
  planning_name: string | null;
  decision_status: string;
  has_ownership: boolean;
  owned_pet_profile_id: string | null;
  pet_type_profiles: { name: string; species: string; mbti_label: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<PlanningProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/planning");
        if (res.status === 402) {
          router.push("/result/0"); // redirect to free results
          return;
        }
        if (!res.ok) throw new Error("Failed to load profiles");
        const data = await res.json();
        setProfiles(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error loading");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleCreate(petTypeProfileId: string) {
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petTypeProfileId }),
      });
      const data = await res.json();
      router.push(`/workspace/${data.id}`);
    } catch {
      setError("Failed to create workspace");
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h1>Your Dashboard</h1>

      {profiles.length === 0 ? (
        <p>You don't have any planning workspaces yet. Take the quiz to get started!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {profiles.map((prof) => (
            <div
              key={prof.id}
              onClick={() => {
                if (prof.has_ownership && prof.owned_pet_profile_id) {
                  router.push(`/owned/${prof.owned_pet_profile_id}`);
                } else {
                  router.push(`/workspace/${prof.id}`);
                }
              }}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 16,
                cursor: "pointer",
              }}
            >
              <strong>{prof.planning_name || prof.pet_type_profiles.name}</strong>
              <div style={{ fontSize: 14, color: "#666" }}>
                {prof.pet_type_profiles.species} · {prof.pet_type_profiles.mbti_label} · {prof.decision_status}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={() => router.push("/quiz")}>Take the quiz again</button>
      </div>
    </div>
  );
}
