"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { Camera, Loader2, Check } from "lucide-react";

interface MatchCardProps {
  matches: Array<{
    pet_type_profile_id: string;
    pet_name?: string;
    species?: string;
    rank: number;
    responsible_fit_score: number;
    mbti_match_score: number;
    mbti_label?: string;
    explanation: string;
  }>;
  userName?: string;
}

export default function MatchCard({ matches, userName }: MatchCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const rankBadge = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-primary to-warning";
    if (rank === 2) return "bg-gradient-to-br from-gray-400 to-gray-300";
    return "bg-gradient-to-br from-amber-700 to-amber-600";
  };

  async function handleExport() {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        width: 1280,
        height: 720,
        useCORS: true,
        allowTaint: false,
      });
      const link = document.createElement("a");
      link.download = "lukluk-match-card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      // html2canvas failure — graceful
    } finally {
      setExporting(false);
    }
  }

  const displayMatches = matches.slice(0, 3);

  return (
    <div>
      {/* Exportable card — rendered offscreen */}
      <div
        ref={cardRef}
        style={{
          width: 1280,
          height: 720,
          position: "absolute",
          left: -9999,
          display: "flex",
          borderRadius: 16,
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
          border: "2px solid #e2e8f0",
        }}
      >
        {/* Left panel */}
        <div
          style={{
            width: 480,
            background: "#1a1a2e",
            color: "white",
            padding: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              🐾 Lukluk
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                marginTop: 24,
              }}
            >
              Your Pet Matches
              {userName && (
                <div style={{ fontSize: 16, opacity: 0.5, marginTop: 8 }}>
                  for {userName}
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 14, opacity: 0.4 }}>lukluk.app</div>
        </div>

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            padding: "40px 48px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h3
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            Top Matches
          </h3>
          {displayMatches.map((m, i) => {
            const isLarger = m.rank === 1;
            return (
              <div
                key={m.pet_type_profile_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 0",
                  borderBottom:
                    i < displayMatches.length - 1
                      ? "1px solid #e2e8f0"
                      : "none",
                }}
              >
                <div
                  style={{
                    width: isLarger ? 48 : 40,
                    height: isLarger ? 48 : 40,
                    borderRadius: "50%",
                    background:
                      m.rank === 1
                        ? "linear-gradient(135deg, #f97316, #f59e0b)"
                        : m.rank === 2
                          ? "linear-gradient(135deg, #94a3b8, #cbd5e1)"
                          : "linear-gradient(135deg, #d97706, #b45309)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isLarger ? 18 : 16,
                    fontWeight: 700,
                  }}
                >
                  #{m.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: isLarger ? 18 : 16,
                      fontWeight: 700,
                    }}
                  >
                    {m.pet_name || m.pet_type_profile_id}
                  </div>
                  {m.species && (
                    <div
                      style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}
                    >
                      {m.species}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      marginTop: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: 3,
                        }}
                      >
                        Fit
                        <span>{m.responsible_fit_score}%</span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: "#e2e8f0",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${m.responsible_fit_score}%`,
                            background: "#22c55e",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: 3,
                        }}
                      >
                        MBTI
                        <span>{m.mbti_match_score}%</span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: "#e2e8f0",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${m.mbti_match_score}%`,
                            background: "#6366f1",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  {m.mbti_label && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 6,
                        padding: "3px 10px",
                        background: "#f0f0ff",
                        color: "#6366f1",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {m.mbti_label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-all hover:border-foreground/20 hover:shadow-sm hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {done ? (
          <>
            <Check className="h-4 w-4 text-success" />
            Saved!
          </>
        ) : exporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            Save Match Card
          </>
        )}
      </button>
    </div>
  );
}
