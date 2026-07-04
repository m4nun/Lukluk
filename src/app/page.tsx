import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl animate-fade-in">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight group">
            <Image
              src="/assets/logo.png"
              alt="Lukluk"
              width={40}
              height={40}
              className="transition-transform duration-300 group-hover:rotate-[-3deg] group-hover:scale-105"
            />
            Lukluk
          </Link>
          <div className="hidden sm:flex items-center gap-9">
            <Link
              href="/experiences"
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Experiences
            </Link>
            <Link
              href="/auth/google"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-[0_2px_8px_rgba(26,26,46,0.2)] transition-all hover:bg-[#2d2d4a] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(26,26,46,0.3)]"
            >
              Start Quiz
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
        <div className="mx-auto grid max-w-[1200px] items-center gap-16 px-6 md:grid-cols-2">
          <div className="animate-fade-in-up">
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-[13px] font-semibold text-primary backdrop-blur-sm tracking-wide">
              🐾 Responsible Pet Matching
            </span>
            <h1 className="text-[clamp(36px,5vw,64px)] font-bold leading-[1.08] tracking-[-0.03em]">
              Find the pet that truly fits your{" "}
              <span className="bg-gradient-to-br from-primary to-orange-400 bg-clip-text text-transparent">
                life
              </span>
            </h1>
            <p className="mt-6 max-w-[480px] text-[clamp(16px,1.8vw,19px)] text-muted-foreground leading-relaxed">
              Take the Fit Quiz and discover your top 3 responsible matches.
              Stop guessing, start matching — backed by real care data and
              agent-powered guidance.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/auth/google"
                className="inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_4px_14px_rgba(249,115,22,0.4)] transition-all hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(249,115,22,0.5)] active:translate-y-0"
              >
                Take the Fit Quiz
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-8 py-4 text-base font-semibold transition-all hover:border-foreground/20 hover:-translate-y-0.5 hover:shadow-md"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Device mockup */}
          <div className="hidden md:flex justify-center">
            <div className="w-[420px] rounded-2xl overflow-hidden border border-border bg-card/50 backdrop-blur-sm shadow-xl transition-transform hover:scale-[1.02] hover:-translate-y-2">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white/70 backdrop-blur-sm rounded-t-2xl">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning animate-pulse" style={{ animationDelay: "0.2s" }} />
                <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" style={{ animationDelay: "0.4s" }} />
                <span className="ml-1 h-6 flex-1 rounded-md bg-white/90 px-2.5 text-[11px] text-muted-foreground leading-6 flex items-center gap-1.5">
                  <svg className="w-3 h-3 shrink-0" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="1.5" fill="#22c55e"/></svg>
                  lukluk.app
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                    <Image src="/assets/PetLogo/golden-retriever/1.png" alt="" width={40} height={40} className="object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Golden Retriever</h4>
                    <span className="text-xs text-muted-foreground">Canis familiaris · ENFP</span>
                  </div>
                  <span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-semibold text-success">Top Match</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: "Golden Retriever", fit: 92, img: "golden-retriever" },
                    { name: "Siamese Cat", fit: 85, img: "siamese-cat" },
                    { name: "Bulldog", fit: 78, img: "bulldog" },
                  ].map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-3 rounded-lg bg-white/80 px-3 py-2.5 border border-border/50 transition-all hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5 cursor-default"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 overflow-hidden">
                        <Image src={`/assets/PetLogo/${p.img}/1.png`} alt="" width={36} height={36} className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold truncate">{p.name}</h5>
                        <div className="mt-1 h-1 rounded-full bg-border/80 overflow-hidden">
                          <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${p.fit}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold tabular-nums">{p.fit}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-14 flex-wrap px-6 py-16">
          {[
            { num: "19", label: "Pet Types Profiled" },
            { num: "8+", label: "Matching Dimensions" },
            { num: "5 min", label: "Quiz Completion" },
            { num: "Agent", label: "Powered Guidance" },
          ].map((s) => (
            <div key={s.label} className="text-center transition-transform hover:-translate-y-1">
              <div className="text-[32px] font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                {s.num}
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-b border-border bg-card py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">
            How It Works
          </span>
          <h2 className="mt-4 text-[clamp(32px,4.5vw,48px)] font-bold tracking-[-0.025em] leading-[1.1]">
            Find your match in{" "}
            <span className="text-primary">three steps</span>
          </h2>
          <p className="mt-5 max-w-[580px] text-lg text-muted-foreground leading-relaxed">
            No sign-up barriers. Take the quiz, see your top matches, and chat with an AI agent to decide responsibly.
          </p>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              { step: "1", title: "Take the Quiz", desc: "Answer 8 lifestyle questions about budget, time, space, and more. It takes 5 minutes.", icon: "📋" },
              { step: "2", title: "See Your Matches", desc: "Get your top 3 responsible pet matches scored across 8 dimensions with explanations.", icon: "📊" },
              { step: "3", title: "Chat with Agents", desc: "Talk to AI agents that help you estimate costs, review concerns, and decide confidently.", icon: "💬" },
            ].map((s) => (
              <div key={s.step} className="group relative rounded-xl border border-border bg-background p-7 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                  {s.icon}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Step {s.step}</span>
                <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pet Types */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">
            Pet Pool
          </span>
          <h2 className="mt-4 text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.02em]">
            19 pet types profiled and{" "}
            <span className="text-primary">ready to match</span>
          </h2>
          <div className="mt-12 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
            {[
              { name: "Golden Retriever", slug: "golden-retriever", emoji: "🦮" },
              { name: "Siamese Cat", slug: "siamese-cat", emoji: "🐱" },
              { name: "Persian Cat", slug: "persian-cat", emoji: "😺" },
              { name: "Bulldog", slug: "bulldog", emoji: "🐶" },
              { name: "Pug", slug: "pug", emoji: "🐕" },
              { name: "Siberian Husky", slug: "siberian-husky", emoji: "🐺" },
              { name: "Welsh Corgi", slug: "welsh-corgi", emoji: "🦊" },
              { name: "Hamster", slug: "hamster", emoji: "🐹" },
              { name: "Rabbit", slug: "rabbit", emoji: "🐰" },
              { name: "Chinchilla", slug: "chinchilla", emoji: "🐿️" },
              { name: "Ferret", slug: "ferret", emoji: "🦡" },
              { name: "Hedgehog", slug: "hedgehog", emoji: "🦔" },
              { name: "Sugar Glider", slug: "sugar-glider", emoji: "🦘" },
              { name: "Sphynx Cat", slug: "sphynx-cat", emoji: "🐈" },
            ].map((p) => (
              <div key={p.slug} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 overflow-hidden">
                  <Image
                    src={`/assets/PetLogo/${p.slug}/1.png`}
                    alt={p.name}
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>
                <span className="text-xs font-medium text-center leading-tight">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card border-b border-border py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">
            Features
          </span>
          <h2 className="mt-4 text-[clamp(32px,4.5vw,48px)] font-bold tracking-[-0.025em] leading-[1.1]">
            Everything you need to choose{" "}
            <span className="text-primary">responsibly</span>
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {[
              { icon: "🛡️", iconColor: "text-success", iconBg: "bg-success/5", title: "Responsible Fit Scoring", desc: "Weighted dimensions covering budget, time, space, allergies, noise, travel, and compatibility with existing pets." },
              { icon: "🧠", iconColor: "text-purple-500", iconBg: "bg-purple-500/5", title: "Personality Matching", desc: "MBTI-style personality mapping to find pets whose temperament aligns with your character." },
              { icon: "💬", iconColor: "text-blue-500", iconBg: "bg-blue-500/5", title: "AI Decision Agent", desc: "Chat with an agent that helps estimate costs, flag concerns, and guide your adoption decision." },
              { icon: "📸", iconColor: "text-warning", iconBg: "bg-warning/5", title: "Shareable Match Card", desc: "Export a beautiful match card to share your top pets with friends and family." },
            ].map((f) => (
              <div key={f.title} className="flex gap-5 rounded-xl border border-border bg-background p-6 transition-colors hover:border-primary/20">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${f.iconBg} text-2xl`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-foreground py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-primary/80">
            Testimonials
          </span>
          <h2 className="mt-4 text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.02em] text-background">
            Loved by pet owners
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { quote: "Lukluk helped me realize a Husky wasn't right for my apartment. Now I have a perfect Siamese cat.", name: "Tan", pet: "Siamese Cat" },
              { quote: "The agent helped me budget properly before getting my Golden. No surprises, just joy.", name: "Mint", pet: "Golden Retriever" },
              { quote: "I thought I wanted a rabbit but the quiz matched me with a hamster — best decision ever.", name: "Ploy", pet: "Hamster" },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-border/20 bg-card/10 backdrop-blur-sm p-6">
                <p className="text-sm text-background/80 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-background">{t.name}</p>
                    <p className="text-xs text-background/50">{t.pet}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
            <h2 className="text-2xl font-bold">Ready to find your match?</h2>
            <p className="mt-3 text-muted-foreground">
              Take the Fit Quiz and get your top 3 responsible pet matches in 5 minutes.
            </p>
            <Link
              href="/auth/google"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-[0_4px_14px_rgba(249,115,22,0.4)] transition-all hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(249,115,22,0.5)]"
            >
              Start the Fit Quiz
            </Link>
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
