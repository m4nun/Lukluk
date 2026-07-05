"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppNav } from "@/components/layout/AppNav";
import { Check, Loader2, Sparkles, X } from "lucide-react";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "price_monthly" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mode === "demo") {
          window.location.href = data.url;
          return;
        }
        window.location.href = data.url;
      } else if (res.status === 401) {
        window.location.href = "/auth/google?next=/pricing";
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
        <div className="mx-auto max-w-[640px] px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-[13px] font-semibold text-primary backdrop-blur-sm tracking-wide">
            <Image src="/assets/logo.png" alt="" width={18} height={18} />
            Simple Pricing
          </span>
          <h1 className="mt-7 text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.03em]">
            One plan,{" "}
            <span className="bg-gradient-to-br from-primary to-orange-400 bg-clip-text text-transparent">
              full access
            </span>
          </h1>
          <p className="mt-5 max-w-[480px] mx-auto text-[clamp(16px,1.8vw,19px)] text-muted-foreground leading-relaxed">
            Unlock AI-powered workspaces, personalized decision guidance, and everything you need
            to choose your pet responsibly.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="flex-1 bg-card border-t border-border py-16">
        <div className="mx-auto max-w-[480px] px-6">
          <div className="relative rounded-2xl border-2 border-primary bg-background p-8 shadow-xl shadow-primary/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-sm">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold tracking-tight">Lukluk Pro</h2>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-[48px] font-bold tracking-tight">฿299</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Cancel anytime. No long-term commitment.
              </p>
            </div>

            <ul className="mt-8 space-y-3.5">
              {[
                "AI Decision Agent — chat about costs, concerns, and fit",
                "Unlimited planning workspaces for any pet type",
                "Expense tables & concern checklists",
                "AI Care Agent for owned pets",
                "Access owner experiences & submit your own",
                "Export & share Match Cards",
              ].map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Subscribe Now
                </>
              )}
            </button>

            {error && (
              <p className="mt-4 text-center text-sm text-destructive">{error}</p>
            )}

            <p className="mt-5 text-center text-xs text-muted-foreground">
              By subscribing you agree to our{" "}
              <Link href="/" className="underline hover:text-foreground">Terms</Link>
              {" "}and{" "}
              <Link href="/" className="underline hover:text-foreground">Privacy Policy</Link>
            </p>
          </div>

          {/* Free tier */}
          <div className="mt-10 text-center">
            <h3 className="text-sm font-semibold text-muted-foreground">Not ready to commit?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Take the quiz and see your top 3 matches for free.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground/70">
              {[
                "Take the Fit Quiz & see top 3 matches",
                "Browse all 19 pet type profiles",
                "View pet MBTI personalities",
              ].map((f) => (
                <div key={f} className="flex items-center justify-center gap-2">
                  <X className="h-3 w-3 text-muted-foreground/40" />
                  <span>{f}</span>
                </div>
              ))}
              <div className="flex items-center justify-center gap-2 mt-1">
                <Check className="h-3 w-3 text-success/60" />
                <span className="text-foreground/60">All free features above</span>
              </div>
            </div>
            <Link
              href="/quiz"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold transition-all hover:border-foreground/20 hover:-translate-y-0.5 hover:shadow-md"
            >
              Start Quiz
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-background py-20">
        <div className="mx-auto max-w-[640px] px-6">
          <h2 className="text-center text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-10 space-y-6">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. You can cancel your subscription at any time from your dashboard. You'll keep access until the end of your billing period.",
              },
              {
                q: "Do I need a subscription to take the quiz?",
                a: "No. The Fit Quiz and your top 3 matches are completely free. You only need a subscription to create workspaces and chat with AI agents.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit and debit cards through Stripe.",
              },
              {
                q: "Is there a free trial?",
                a: "Not at the moment, but the quiz and match results are free — try them first to see if Lukluk is right for you.",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
