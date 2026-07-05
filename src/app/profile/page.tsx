"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppNav } from "@/components/layout/AppNav";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import {
  LogOut, User, Mail, CreditCard, PawPrint, ClipboardList,
  Loader2, ChevronRight, BadgeCheck, AlertCircle, Clock
} from "lucide-react";

interface ProfileData {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  subscription: { status: string; stripeSubscriptionId: string } | null;
  workspaceCount: number;
  ownedCount: number;
}

interface LifestyleData {
  hasLifestyle: boolean;
  lifestyle?: {
    id: string;
    quiz_answers: Record<string, unknown>;
    follow_ups: Array<{ question: string; answer: string }>;
    completed_at: string;
  };
}

const statusConfig: Record<string, { label: string; icon: typeof BadgeCheck; className: string }> = {
  active: { label: "Active", icon: BadgeCheck, className: "text-success bg-success/10" },
  past_due: { label: "Past Due", icon: AlertCircle, className: "text-warning bg-warning/10" },
  canceled: { label: "Canceled", icon: Clock, className: "text-muted-foreground bg-muted" },
  inactive: { label: "Inactive", icon: AlertCircle, className: "text-muted-foreground bg-muted" },
};

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [lifestyle, setLifestyle] = useState<LifestyleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, lifestyleRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/lifestyle"),
        ]);
        
        if (profileRes.status === 401) {
          router.push("/auth/google?next=/profile");
          return;
        }
        if (!profileRes.ok) throw new Error("Failed to load");
        
        setData(await profileRes.json());
        if (lifestyleRes.ok) {
          setLifestyle(await lifestyleRes.json());
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppNav />
        <div className="mx-auto w-full max-w-[640px] px-6 py-12">
          <LoadingSkeleton variant="card" />
          <div className="mt-6"><LoadingSkeleton variant="table" rows={3} /></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="mt-2 text-muted-foreground">{error || "Could not load profile."}</p>
            <Link href="/" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sub = data.subscription;
  const subStatus = sub ? statusConfig[sub.status] ?? statusConfig.inactive : null;

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-[640px] px-6">
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

          {/* Account */}
          <section className="mt-8 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Account</h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  {data.avatarUrl ? (
                    <img src={data.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{data.displayName || "Pet Lover"}</p>
                  <p className="text-xs text-muted-foreground truncate">{data.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1">{data.email}</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Google</span>
              </div>
            </div>
          </section>

          {/* Subscription */}
          <section className="mt-8 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Subscription</h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {sub ? (
                <>
                  <div className="flex items-center gap-3 p-4">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">Lukluk Pro</span>
                    {subStatus && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${subStatus.className}`}>
                        <subStatus.icon className="h-3 w-3" />
                        {subStatus.label}
                      </span>
                    )}
                  </div>
                  {sub.status === "active" && (
                    <button
                      onClick={() => {
                        /* Cancel portal — Stripe customer portal or email support for v1 */
                      }}
                      className="flex w-full items-center justify-between p-4 text-sm text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <span>Cancel subscription</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">No active subscription</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Subscribe to unlock AI agents, workspaces, and full pet planning tools.
                      </p>
                      <Link
                        href="/pricing"
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
                      >
                        View Plans
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Stats */}
          <section className="mt-8 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Your Pets</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20"
              >
                <PawPrint className="h-5 w-5 text-primary" />
                <p className="mt-2 text-2xl font-bold">{data.workspaceCount}</p>
                <p className="text-xs text-muted-foreground">Planning profiles</p>
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20"
              >
                <BadgeCheck className="h-5 w-5 text-success" />
                <p className="mt-2 text-2xl font-bold">{data.ownedCount}</p>
                <p className="text-xs text-muted-foreground">Owned pets</p>
              </Link>
            </div>
          </section>

          {/* Quiz Answers */}
          <section className="mt-8 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Quiz Answers</h2>
            <div className="rounded-xl border border-border bg-card p-4">
              {lifestyle?.hasLifestyle && lifestyle.lifestyle ? (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Fit Quiz completed</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(lifestyle.lifestyle.completed_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {lifestyle.lifestyle.follow_ups.length > 0 &&
                            ` · ${lifestyle.lifestyle.follow_ups.length} follow-up questions`}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/quiz?retake=true"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-foreground/20"
                    >
                      Retake
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">No quiz taken yet</p>
                      <p className="text-xs text-muted-foreground">
                        Take the Fit Quiz to discover your top pet matches.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/quiz"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Take Quiz
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <section className="mt-10 space-y-3">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-3.5 text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 disabled:opacity-60"
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </button>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between px-6">
          <p>© 2026 Lukluk. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/experiences" className="hover:text-foreground transition-colors">Experiences</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
