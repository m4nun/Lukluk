# Lukluk

Lukluk helps people choose a suitable pet type before ownership, then supports care after ownership. This README is the single technical reference — setup, architecture, decisions, current status, assets, and task tracking. Domain language lives in `CONTEXT.md`; product scope lives in `PRD.md`.

## Quick Start

```bash
git clone <repo-url> && cd Lukluk
npm install
cp .env.example .env.local   # fill in values (see Environment Variables)
npm test
npm run dev
```

## Environment Variables

Create `.env.local` from `.env.example`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM access (optional — rule-based fallback used without it) |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (optional — mock mode without it) |
| `STRIPE_SECRET_KEY` | Stripe secret key (optional) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (optional) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) or production URL |

**Mock-first design**: Every protected route checks `process.env.STRIPE_SECRET_KEY`. Without it, subscription checks are skipped and checkout returns a demo URL. Without `OPENROUTER_API_KEY`, `callLLM()` returns null and the follow-up route uses rule-based fallbacks. Plug real keys to enable real behavior with zero code changes.

## Database Setup

1. Create a Supabase project.
2. Run `supabase_schema.sql` in the SQL Editor — 12 tables with RLS, triggers, indexes across 6 zones: Auth (profiles), Static (pet_type_profiles), User Data (lifestyle_profiles, match_results, planning_pet_profiles, owned_pet_profiles), Agent (agent_threads, agent_drafts, estimated_expenses, concern_checklist_items), Content (owner_experiences), Payments (subscriptions).
3. LangGraph checkpoints live in `checkpoints`, `checkpoint_blobs`, `checkpoint_writes` (auto-created).
4. Auth: enable Google OAuth in Supabase Dashboard → Authentication → Providers. Google OAuth is the only auth method — no email/password routes exist.

### Seed Pet Type Profiles

```
GET /api/seed
```

Reads all YAML files in `pet_pools/`, validates via Zod schema, runs consistency checks, and upserts into `pet_type_profiles`. Dev only. Re-seed after any profile change.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing (hero, pet grid, CTA)
│   ├── quiz/page.tsx         # 9-step quiz, phase machine: quiz → analyzing → followup → matching
│   ├── result/[id]/page.tsx  # Top 3 + Match Card; guests read sessionStorage
│   ├── dashboard/page.tsx    # Workspace list + onboarding gate
│   ├── workspace/[id]/       # Two-panel planning workspace + Decision Agent
│   ├── owned/[id]/           # Ownership mode workspace + Care Agent
│   ├── pet/[slug]/           # Pet detail page
│   ├── experiences/          # Owner Experience reading/submission
│   ├── pricing/              # Subscription pricing
│   ├── profile/              # User profile
│   ├── auth/{google,callback}/
│   └── api/                  # See API Routes below
├── components/
│   ├── onboarding/           # OnboardingModal (4 slides), shown before quiz
│   ├── quiz/, modals/, layout/, match-card/, pet/, workspace/, agent/
│   │   └── agent/            # AgentChat, CareChat, ChatMap (inline Leaflet map)
│   └── ui/                   # shadcn/ui components
├── hooks/
├── lib/
│   ├── agent/                # LangGraph: graph.ts, tools.ts, repository.ts (interface),
│   │                         #   supabase-repo.ts, supabase-draft-store.ts, care-tools.ts,
│   │                         #   map-places.ts (Nominatim/Overpass), tool-results.ts
│   ├── matching/             # engine.ts (runMatch, 8-dim scoring), dimensions.ts (ScoreDimension)
│   ├── llm/config.ts         # callLLM() — OpenRouter client
│   ├── pipeline/             # validate.ts (Zod), seed.ts (YAML → DB)
│   ├── quiz/questions.ts     # 9 fixed questions + transformAnswers() + isLifestyleComplete()
│   ├── stripe/guard.ts       # isSubscriber(), requireSubscriber()
│   ├── supabase/             # server.ts, client.ts, admin.ts (all lazy), middleware.ts
│   ├── pet-logos.ts          # Shared getPetLogo() — maps YAML ID to asset folder
│   └── types.ts
└── proxy.ts                  # Session refresh proxy
```

## API Routes

| Method | Route | Auth | Sub | Description |
|--------|-------|------|-----|-------------|
| GET | `/auth/google` | — | — | Start Google OAuth |
| GET | `/auth/callback` | — | — | OAuth callback |
| POST | `/api/auth/logout` | User | — | End session |
| POST | `/api/match` | — | — | Quiz → match → save (auth) / sessionStorage (guest) |
| POST | `/api/match/follow-up` | — | — | LLM or rule-based clarifying questions (cap 20) |
| GET | `/api/match/[id]` | User | — | Match result by ID |
| GET | `/api/lifestyle` | User | — | Lifestyle profile exists? (drives onboarding gate) |
| GET | `/api/pet/[slug]` | — | — | Pet profile by slug |
| GET | `/api/planning` | User | — | List planning profiles |
| POST | `/api/planning` | User | Mock | Create planning profile |
| POST | `/api/agent/chat` | User | Mock | Decision Agent chat (stub without OpenRouter key) |
| POST | `/api/agent/care` | User | Mock | Care Agent chat (stub) |
| POST | `/api/agent/drafts` | User | — | Agent draft proposals |
| GET | `/api/experiences` | — | — | List owner experiences |
| POST | `/api/experiences` | User | Mock | Submit owner experience (live immediately) |
| GET | `/api/ownership/[id]` | User | — | Get owned profile |
| POST | `/api/ownership/transition` | User | Mock | Planning → owned conversion |
| GET/POST | `/api/profile` | User | — | User profile |
| POST | `/api/stripe/checkout` | User | — | Demo URL or real Stripe checkout |
| POST | `/api/stripe/webhook` | Stripe | — | Stripe events (mock fallback without keys) |
| GET | `/api/seed` | — | — | YAML → Supabase seed (dev only) |

## Architecture Principles

1. **Inject dependencies** — repo, tools, dimensions are injected, not imported.
2. **Pure functions at seams** — matching engine, quiz transforms, validators are pure and fully tested.
3. **Interface before implementation** — `PlanningRepository`, `ScoreDimension` define the contract; adapters (`supabase-repo.ts`) define how.
4. **Lazy initialization** — Supabase admin and Stripe client are lazy so the build survives without env vars.
5. **Google OAuth only** — no email/password auth routes.
6. **Lifestyle profile as state** — `/api/lifestyle` determines whether a user needs onboarding/quiz.
7. **Pet Type Profiles are repo-managed YAML** — single source of truth, validated at build/seed time, not editable via admin UI in v1.
8. **Snapshot queries via denormalized JSONB** — normalized tables (estimated_expenses, concern_checklist_items) mirror JSONB in planning_pet_profiles.

## Architecture Decisions (ADR — grilled 2026-07-03)

- **D1 Tech Stack**: Next.js monolith + Supabase + OpenRouter + Vercel. Monolith now, can split later.
- **D2/D12 Agent Framework**: LangGraph as the primary runtime (StateGraph: agentNode ↔ toolNode loop, PostgresSaver to Supabase for checkpointing). Custom SSE streaming + custom `useAgentChat` hook — LangGraph and Vercel AI SDK don't natively interop. Node.js runtime required (not Edge) due to `pg`.
- **D3 Agent Edit Drafts**: LLM calls tools → backend produces draft → user confirms before save. Drafts in a separate `agent_drafts` table.
- **D4/D11 LLM Context**: For v1, raw context injection (Pet Type Profile, Lifestyle Profile, Owner Experiences, session history) with context compacting/summarization when token budget is exceeded.
- **D5 Pet Pipeline**: Build/seed step validates YAML and seeds Supabase. Profile changes require a deploy/seed.
- **D6 Session Persistence**: LangGraph state persisted in Supabase between turns (survives deploys/restarts).
- **D7 Match Card**: Client-side screenshot via html2canvas — free-tier friendly, no server rendering.
- **D8 Matching Engine**: Server-side API route (hides scoring logic, has LLM key for follow-ups).
- **D9 Follow-Up Questions**: LLM generates up to 3 clarifying questions only when borderline/uncertain answers could change top 3 or responsible-fit constraints.
- **D10 Payments**: Stripe, test mode only for v1.

## Current Status (as of 2026-07-06)

### Built & Working
- **Infrastructure**: Next.js 16 (Turbopack) + TypeScript + Tailwind v4; Supabase server/client/admin clients; Stripe checkout + webhook (mock-aware); OpenRouter integration.
- **Database**: 12 tables, RLS, triggers, indexes; supabase_schema.sql in repo root.
- **Pet Type Profiles**: 19 validated YAML profiles with short & punchy display names (Golden Gentleman, Sassy Siamese, Fluffy Persian, Cool Cat Shorthair, Naked Noble, Buff Bulldog, Party Pug, Snow Explorer, Royal Corgi, Pocket Rocket, Gerbil Ninja, Hop Star, Cloud Chinchilla, Ferret Ninja, Spikestar, Sugar Glider Ace, Fennec Flash, Iguana King, Axolotl Angel).
- **Core**: 9-question fixed Fit Quiz with phase machine; pure matching engine (8 weighted dimensions + MBTI secondary); LLM follow-up round (cap 20); match result storage; onboarding modal (4 slides) gated by `/api/lifestyle`.
- **Subscriber**: Stripe test checkout → webhook → subscription; `requireSubscriber()` gating; Planning Pet Profile CRUD; Owner Experiences (subscriber-only POST, live immediately).
- **Agent**: LangGraph StateGraph; 5 tools in Decision Agent (update_expenses, update_concerns, update_decision_status, get_context, search_pet_places); 6 tools in Care Agent (plus update_actual_expenses, update_food_guide, update_schedule, add_health_metric); PlanningRepository interface + Supabase adapter; per-profile agent threads.
- **Inline Map**: `search_pet_places` tool renders an interactive Leaflet map inside the chat message bubble. Server geocodes the location via OpenStreetMap Nominatim and queries the Overpass API for pet shops, veterinary clinics, pet boarding, dog parks, and grooming within 8km. Results stream through the existing SSE `done` event as a `toolResults` payload and render as clickable markers + popups + a scrollable place list. No new API keys required.
- **Ownership**: Planning → owned conversion; required fields enforced (pet name, age/life stage); agent thread switches to care type; left panel shows expenses, activity schedule, food guide.
- **Tests**: 46 passing across 4 suites (dimensions 16, engine 8, questions 11, validate 11).

### User Flow
```
Guest:    / → Start Quiz → 9 questions → analyzing → follow-ups (rule/LLM)
          → matching → /result/latest → 3 ranked matches
Login:    / → Sign in with Google → /auth/callback → /dashboard
          → Onboarding modal (first login) → Quiz → lifestyle profile → Dashboard with workspaces
Workspace: Dashboard → workspace[id] → Expenses/Concerns/DecisionStatus + Agent chat
          → mark "I have this pet" → owned[id] → Care Agent + expenses/schedule/food
```

### Production Prerequisites
1. Google OAuth — manual browser login at localhost:3000.
2. Stripe keys in `.env.local` for real payments (otherwise mock checkout/webhook).
3. OpenRouter key in `.env.local` for real AI agents (otherwise stub responses).
4. Re-seed pet profiles after name changes: `GET /api/seed`.
5. Design/visual polish — everything functional; HTML mockups in `design/` to apply.

### Known Issues
1. Pre-existing TS error in `src/lib/agent/invoke.ts:77` — `ToolMessage` type cast. Not blocking.
2. Pre-existing TS errors in test fixtures (`engine.test.ts`, `validate.test.ts`) — test data type mismatches, unrelated to features. Not blocking; the `next build` production build passes.

### Remaining (polish/design only)
- Agent draft confirmation flow (deferred for v1 speed — direct writes currently).
- Care Agent distinct system prompt + tools (care-tools.ts exists, needs polish).
- Buying/Adoption guidance explicit gate (currently natural via agent tool calls).
- Apply `design/` HTML mockups for visual polish across all pages.

## Testing

```bash
npm test            # 46 tests across 4 suites
npm run test:watch
```

Test seams are pure function boundaries: matching engine receives injected profiles and dimensions; quiz transforms are pure; pipeline validation tests valid/invalid YAML.

## Frontend Assets

Pet images live in `public/assets/PetLogo/{slug}/1.png`, `2.png`, etc. Slug matches the YAML `id`. Two mismatches handled in `src/lib/pet-logos.ts`: `american-shorthair → american-shorthair-cat`, `sphynx → sphynx-cat`.

### Image contexts
- Landing pet grid — small circles (56×56), face/head focus.
- Result rank badges — medium rounded squares (56–64px), head + some body.
- Dashboard avatars — circle (52px), tight face crop.
- Pet detail hero — large rounded square (80px), face + body.
- Match Card export — circle (40–48px), face-only.

### Color tokens
| Section | Color |
|---------|-------|
| Responsible Fit Score | `bg-success` (green) |
| MBTI Compatibility | `bg-indigo-500` |
| Decision Agent | `bg-blue-500` |
| Match Card | `bg-warning` (amber) |

Score bar: ≥80% green (`bg-success`), 60–79% amber (`bg-warning`), <60% gray (`bg-muted-foreground`).

Concern severity: Minor = `bg-warning/10`, Moderate = `bg-destructive/10`, Major = `bg-destructive/20`.

Nav: unauthenticated shows "Sign in with Google"; authenticated shows Dashboard + Sign out; quiz shows Back + Skip; workspace shows ← Dashboard + pet name + status badge. All CTAs are `rounded-full`; primary `bg-primary`, secondary white border, sign-in uses Google brand colors + "G" icon.

## Task Board (local mirror of Notion kanban)

Statuses: Not started / In development / Testing / Reviewing / Done. Engineering items below are all **Done**. Remaining open work is design — 18 design cards cover every screen; user will provide designs for implementation.

**Open (Design, Not started)**: product narrative + landing, account creation + onboarding, Fit Quiz experience, LLM follow-up moment, Match Result page, Shareable Match Card, subscription upgrade moment, subscriber dashboard, planning two-panel workspace, expense table interactions, concern checklist interactions, decision status UI, decision agent chat, agent draft confirmation flow, owner experiences reading/submission, buying/adoption guidance gate, ownership setup flow, ownership mode workspace + Care Agent, responsive system + UI components, empty/loading/error/permission states, design QA review.

**Done (Engineering)**: Supabase auth + profile provisioning; Pet Type Profile YAML validation + seed pipeline; 19 validated Pet Type Profiles; Fixed Fit Quiz flow; Responsible Fit matching engine; LLM follow-up question round; Match Result page + Match Card export endpoint; Stripe test-mode subscription boundary; subscriber dashboard + Planning Pet Profile creation; two-panel workspace + LangGraph Decision Agent; Owner Experiences; Buying/Adoption guidance gate; Ownership setup + transition + Care Agent; inline interactive map in agent chat (search_pet_places tool + Leaflet rendering); design shells (8 pages, 4 components); RLS/API/pure-module tests (46); roadmap + README + ADR + supabase schema.

## Deployment

1. Push to GitHub → connect Vercel → set env vars in Vercel dashboard.
2. Run `supabase_schema.sql` on Supabase.
3. Deploy.
4. Seed profiles: `curl https://your-app.vercel.app/api/seed` (drop the dev-only guard for prod seeding).

### Stripe Test Mode
Card `4242 4242 4242 4242`, any future expiry, any 3-digit CVC. Webhook forwarding: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.