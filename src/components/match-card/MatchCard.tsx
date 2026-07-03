"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";

interface MatchCardProps {
  matches: Array<{
    pet_type_profile_id: string;
    rank: number;
    responsible_fit_score: number;
    mbti_match_score: number;
    explanation: string;
  }>;
}

export default function MatchCard({ matches }: MatchCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        width: 1280,
        height: 720,
      });
      const link = document.createElement("a");
      link.download = "lukluk-match-card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Exportable card */}
      <div
        ref={cardRef}
        style={{
          width: 1280,
          height: 720,
          position: "absolute",
          left: -9999,
          display: "flex",
          background: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ flex: "0.4", background: "#333", color: "white", padding: 60, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: 48, margin: 0 }}>🐾 Lukluk</h1>
          <p style={{ fontSize: 24, marginTop: 16, opacity: 0.8 }}>Your Pet Matches</p>
        </div>
        <div style={{ flex: "0.6", padding: 60, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
          {matches.map((m) => (
            <div key={m.pet_type_profile_id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 36, fontWeight: 700, minWidth: 50 }}>
                #{m.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{m.pet_type_profile_id}</div>
                <div style={{ fontSize: 16, color: "#666" }}>
                  Fit: {m.responsible_fit_score}% · MBTI: {m.mbti_match_score}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        style={{ padding: "12px 24px", fontSize: 16 }}
      >
        {exporting ? "Generating..." : "📸 Save Match Card"}
      </button>
    </div>
  );
}
