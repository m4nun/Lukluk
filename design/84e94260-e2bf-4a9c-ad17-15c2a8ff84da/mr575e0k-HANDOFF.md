# Lukluk Handoff — Final

**Date**: 2026-07-03
**Status**: All engineering complete. Build clean. 46 tests pass. 23 routes. Architecture reviewed and deepened.

## Phases Completed

1. **Architecture Grilling** — 13 ADRs (Next.js + Supabase + OpenRouter + Vercel, Google OAuth only, LangGraph agent)
2. **Full Implementation** — 19 Pet Type Profiles, 16 API routes, matching engine, quiz, Stripe, planning/ownership workspaces
3. **Codebase Design** — `PlanningRepository` interface, `ScoreDimension` pluggable, matching engine made pure
4. **Page Shells** — 8 pages + 4 components (no styling)
5. **PRD Gaps Closed** — Care Agent, Draft workflow, Guidance gate, Match Card export
6. **Architecture Review & Deepening** — 5 improvements applied (see below)

## Architecture Review Results (Phase 6)

5 deepening candidates accepted and applied. Build stayed green throughout.

| # | Change | Lines Saved | Key File |
|---|--------|------------|----------|
| 1 | Collapsed twin agent factories → single `createAgent({profileId, repo, tools, systemPrompt, idParam})` | ~100 | `agent/graph.ts` |
| 2 | Centralized LLM config → `getChatModel()` + `callLLM()` in one file | ~10 | `lib/llm/config.ts` |
| 3 | Fixed DraftPlanningRepository leak → `DraftStore` interface + `SupabaseDraftStore` adapter, all 6 writes now snapshot `current_value` consistently | 0 (quality) | `agent/draft-store.ts`, `agent/supabase-draft-store.ts` |
| 4 | Shared agent route boilerplate — both routes now have thread persistence, return `thread_id` | 0 (quality) | `api/agent/chat/route.ts`, `api/agent/care/route.ts` |
| 5 | SafeTool wrapper — `safeTool(fn, {name, description, schema})` eliminates 48 lines of repeated try/catch across 8 tools | ~48 | `agent/safe-tool.ts` |

Also fixed: 2 Next.js 16 `params: Promise<>` type errors, unused import. 2 bonus API routes discovered + fixed: `GET /api/match/[id]`, `GET /api/ownership/[id]`.

## Routes (23 total)

| Page Route | Description |
|-----------|-------------|
| `/` | Google sign-in landing |
| `/quiz` | 9-step quiz |
| `/result/[id]` | Top 3 matches + subscription CTA + Match Card export |
| `/dashboard` | Planning profile list |
| `/workspace/[id]` | Two-panel: expenses/concerns/status + draft panel + guidance gate + Decision Agent |
| `/owned/[id]` | Ownership: expenses/activity/food + Care Agent |
| `/experiences` | Read + submit owner anecdotes |

| API Route | Auth | Notes |
|----------|------|-------|
| `/auth/google`, `/auth/callback` | None | Google OAuth flow |
| `/api/auth/logout` | User | |
| `/api/match`, `/api/match/follow-up` | User | Main match + LLM follow-up |
| `/api/match/[id]` (GET) | User | Fetch match result by ID |
| `/api/agent/chat` | User | Decision Agent (draft-wrapped) |
| `/api/agent/care` | User | Care Agent (thread persistence) |
| `/api/agent/drafts` | User | List pending, confirm, reject |
| `/api/planning` | Subscriber | CRUD planning profiles |
| `/api/experiences` | Subscriber | Submit owner experience |
| `/api/ownership/transition` | Subscriber | Planning → owned conversion |
| `/api/ownership/[id]` (GET) | User | Fetch owned profile |
| `/api/stripe/checkout`, `/api/stripe/webhook` | User/Stripe | Test mode payments |
| `/api/seed` | Dev only | YAML → Supabase pipeline |

## Key Modules

| Module | Interface | Tests |
|--------|-----------|-------|
| `matching/engine.ts` | `runMatch(profiles, lifestyle, dimensions?)` | 8 |
| `matching/dimensions.ts` | `ScoreDimension[]` (8 dimensions) | 16 |
| `quiz/questions.ts` | `FIXED_QUESTIONS`, `transformAnswers()` | 11 |
| `pipeline/validate.ts` | `validatePetProfile()`, `consistencyCheck()` | 11 |
| `agent/graph.ts` | `createAgent(opts)` — single factory for both agents | — |
| `agent/repository.ts` | `PlanningRepository` (18 methods) | — |
| `agent/tools.ts` | `createAgentTools(repo)` — 4 tools via `safeTool()` | — |
| `agent/care-tools.ts` | `createCareTools(repo)` — 4 tools via `safeTool()` | — |
| `agent/safe-tool.ts` | `safeTool(fn, opts)` — try/catch wrapper | — |
| `agent/draft-store.ts` | `DraftStore` interface + `CreateDraft` type | — |
| `agent/supabase-draft-store.ts` | `SupabaseDraftStore` adapter | — |
| `agent/draft-repo.ts` | `DraftPlanningRepository(real, drafts, userId)` — injectable! | — |
| `llm/config.ts` | `getChatModel()`, `callLLM()` — centralized LLM | — |
| `stripe/guard.ts` | `isSubscriber()`, `requireSubscriber()` | — |

## Architecture Principles (enforced)

1. **Inject dependencies** — repo, drafts, tools, dimensions are injected, not imported
2. **Pure functions at seams** — matching, quiz, validation are pure
3. **Interface before implementation** — `PlanningRepository`, `ScoreDimension`, `DraftStore`
4. **Lazy init** — Supabase admin, Stripe are lazy
5. **Google OAuth only** — no email/password
6. **RLS on all tables** — security at database level
7. **Agent writes → drafts → user confirms** — no direct writes from agent tools
8. **Single agent factory** — `createAgent()` serves both Decision and Care agents

## Remaining Work

**Design** (KANBAN.md — 18 cards, Design-owned):
Product narrative, onboarding flow, quiz UI, follow-up question UX, Match Result page, Shareable Match Card styling, subscription upgrade styling, subscriber dashboard UI, two-panel workspace design, expense table interactions, concern checklist interactions, decision status UI, agent chat styling, draft confirmation flow styling, Owner Experiences design, guidance gate styling, ownership setup flow, ownership workspace styling, responsive system, empty/loading/error states, Design QA.

**Testing gaps** (no tests exist for):
- `agent/repository.ts` — 18-method interface, testable with an in-memory adapter
- `agent/tools.ts`, `agent/care-tools.ts` — tools are testable via `safeTool` + mock repo
- `agent/draft-repo.ts` — draft wrapper is now testable via mock `DraftStore`
- `agent/graph.ts` — agent graph with mock tools and model
- API route behavior (requires running Supabase + Stripe)

## Suggested Skills

- `design` — Design the UI for all remaining Design cards
- `tdd` — Write tests for agent, draft, and API modules
- `to-issues` — Create GitHub issues from kanban
- `code-review` — Review implementation against PRD and ADR
