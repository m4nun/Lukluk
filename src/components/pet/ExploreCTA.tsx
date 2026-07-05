"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";

interface ExploreCTAProps {
  petTypeId: string;
  petName: string;
}

export function ExploreCTA({ petTypeId, petName }: ExploreCTAProps) {
  const router = useRouter();
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleExplore() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petTypeProfileId: petTypeId }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/workspace/${data.id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402) {
          router.push("/");
        }
      }
    } catch {}
    finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-full bg-white/20 px-6 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      </div>
    );
  }

  if (user) {
    return (
      <button
        onClick={handleExplore}
        disabled={creating}
        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-purple-500 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating workspace...
          </>
        ) : (
          <>
            Explore {petName}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    );
  }

  return (
    <Link
      href="/auth/google"
      className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-purple-500 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ fontFamily: "var(--font-display)" }}
    >
      Sign in with Google
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </Link>
  );
}
