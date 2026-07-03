"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MatchCard from "@/components/match-card/MatchCard";

interface MatchEntry {
  pet_type_profile_id: string;
  rank: number;
  responsible_fit_score: number;
  mbti_match_score: number;
  explanation: string;
}

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/match/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setMatches(data.top_matches || []);
        }
      } catch (err) {
        console.error("Failed to load match result", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleSubscribe() {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "price_test" }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch {
      // Stripe test mode may not be configured
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading your matches...</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Your Pet Matches</h1>
        {matches.length > 0 && <MatchCard matches={matches} />}
      </div>

      {matches.length === 0 ? (
        <div>
          <p>Take the quiz first to see your matches.</p>
          <button onClick={() => router.push("/quiz")}>Start Quiz</button>
          <div style={{ marginTop: 32, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
            <h3>Unlock Full Experience</h3>
            <p>Subscribe to create planning workspaces and chat with our Decision Agent.</p>
            <button onClick={handleSubscribe}>Subscribe Now</button>
          </div>
        </div>
      ) : (
        <div>
          <ol>
            {matches.map((m) => (
              <li key={m.pet_type_profile_id} style={{ marginBottom: 16, border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
                <strong>#{m.rank} — {m.pet_type_profile_id}</strong>
                <div>Fit: {m.responsible_fit_score}% | MBTI: {m.mbti_match_score}%</div>
                <p>{m.explanation}</p>
              </li>
            ))}
          </ol>
          <div style={{ marginTop: 24, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
            <h3>Want to explore any of these?</h3>
            <p>Subscribe to create a planning workspace and get help from our Decision Agent.</p>
            <button onClick={handleSubscribe}>Subscribe Now</button>
          </div>
        </div>
      )}
    </div>
  );
}
