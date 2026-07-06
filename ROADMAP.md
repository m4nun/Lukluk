# Lukluk v1 Implementation Roadmap

## What's Built

### Infrastructure (✓ Done)
- Next.js 16 app bootstrapped with TypeScript, Tailwind
- Supabase clients (server, browser, admin) with session proxy
- Google OAuth flow (only auth method)
- Stripe test-mode checkout + webhook
- OpenRouter LLM integration (via LangChain ChatOpenAI)

### Database (✓ Done)
- 12 tables with full RLS policies, triggers, indexes
- Schema: auth → pet knowledge → user data → agent → content → payments
- Denormalized JSONB mirrors for snapshot queries

### Pet Type Profiles (✓ Done)
- 19 validated YAML profiles with short & punchy display names
- Zod schema validation + consistency checks
- Build-step seed pipeline via GET /api/seed

### Core Product (✓ Done)
- 9-question fixed Fit Quiz with transform logic
- Pure matching engine: 8 weighted dimensions + MBTI fit
- LLM follow-up question round (capped at 20)
- Match result storage
- Google OAuth landing page

### Onboarding (✓ Done)
- 4-step onboarding modal on `/dashboard` for first-time logged-in users
- Shows before quiz, state tracked via `/api/lifestyle` (no localStorage)
- Animated slides with pet images, floating badges, progress dots

### Subscriber Features (✓ Done)
- Stripe test checkout → webhook → subscription activation
- Subscriber gating via `requireSubscriber()`
- Planning Pet Profile CRUD
- Owner Experience submission (subscriber-only, live immediately)

### Agent System (✓ Done)
- LangGraph StateGraph: agentNode ↔ toolNode loop
- 4 tools: update_expenses, update_concerns, update_decision_status, get_context
- PlanningRepository interface with Supabase adapter (testable seam)
- Agent thread management per planning profile

### Ownership (✓ Done)
- Planning → owned profile conversion
- Required fields enforced: pet name, age/life stage
- Agent thread switches to care agent type
- Left panel: expenses, activity schedule, food guide (JSONB)

### Code Quality (✓ Done)
- 46 tests passing across 4 suites (matching, dimensions, quiz, pipeline)
- Matching engine is pure: `runMatch(profiles, lifestyle, dimensions?)`
- Scoring dimensions are pluggable data objects: `ScoreDimension`
- Agent tools depend on injected `PlanningRepository`, not Supabase

## What's Left

### Must Do Before Launch
1. ~~Tests~~ — Done (46 passing)
2. ~~Documentation~~ — Done (README, HANDOFF, CONTEXT, ADR, ROADMAP)
3. ~~Landing page~~ — Done (hero, pet grid, features, testimonials, CTA)
4. **Re-seed pet profiles** — After name changes, run `GET /api/seed`
5. **Google OAuth testing** — Manual browser verification needed

### Nice to Have
6. **Match Card export** — html2canvas integration for social sharing image
7. **Streaming agent responses** — SSE streaming from LangGraph to client
8. **Agent draft confirmation** — Draft table + confirmation flow (skipped for v1 speed)
9. **Care Agent polish** — Different system prompt + tools for ownership mode
10. **Buying/Adoption guidance gate** — Structured gating logic in agent prompt

### Design (User-owned)
18 design cards spanning every screen — the user will provide designs for implementation.

### Pre-existing Issues
- **TS error in `invoke.ts:77`** — type cast issue with `ToolMessage`. Not blocking.

## Architecture Principles (for future agents)

1. **Inject dependencies** — repo, tools, dimensions are injected, not imported
2. **Pure functions at seams** — matching engine, quiz transforms, validators are pure
3. **Interface before implementation** — PlanningRepository, ScoreDimension define what, adapters define how
4. **Lazy initialization** — Supabase admin, Stripe client are lazy to survive build without env vars
5. **Google OAuth only** — no email/password auth routes exist
6. **Lifestyle profile as state** — `/api/lifestyle` determines if user needs onboarding/quiz
