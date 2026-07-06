# Lukluk Handoff — 2026-07-06

Generated from multi-session work. Full project docs at `HANDOFF_NEXT.md`, asset guide at `ASSET_GUIDE.md`.

## What the Next Session Is About

Pick up where this session left off — the project is functionally complete with mock/demo backends. Read `HANDOFF_NEXT.md` for full context, then continue testing, polishing, and optionally wiring production keys (Stripe, OpenRouter).

## Project at a Glance

- **Stack**: Next.js 16.2.10 (Turbopack), Supabase, OpenRouter (optional)
- **Branch**: `master`
- **`.env.local`**: Supabase URL + anon key set. No Stripe or OpenRouter keys.
- **Pet data**: 19 YAML profiles in `pet_pools/`, seeded to Supabase `pet_type_profiles` table.
- **Pet names**: Short & punchy display names (Golden Gentleman, Sassy Siamese, Party Pug, etc.)
- **Pet images**: `public/assets/PetLogo/{folder}/1.png` — see `ASSET_GUIDE.md` for naming conventions and sizes.
- **YAML → asset mapping**: `src/lib/pet-logos.ts` handles the two mismatches (`american-shorthair` → `american-shorthair-cat`, `sphynx` → `sphynx-cat`)
- **46 tests passing** across 4 suites

## Key Architecture Decisions

- **Mock-first subscription**: Every protected route checks `process.env.STRIPE_SECRET_KEY`. When absent, sub checks are skipped. Plug the key → real Stripe checkout/webhook activate with zero code changes.
- **OpenRouter agents**: `src/lib/llm/config.ts` calls `https://openrouter.ai/api/v1`. Without `OPENROUTER_API_KEY`, `callLLM()` returns null and rule-based fallbacks take over in `api/match/follow-up`.
- **Guest quiz flow**: Matches stored in `sessionStorage`, result page reads from it. No auth or DB write needed for guests.
- **Agent chat is stub**: `api/agent/chat` and `api/agent/care` return placeholder responses with auth + sub checks. The real LangGraph agent is in `src/lib/agent/invoke.ts` — just needs an OpenRouter key.
- **Phase machine for quiz**: `quiz → analyzing → followup → matching` — single `phase` state variable, no ad-hoc flags.
- **Onboarding before quiz**: First-time logged-in users see a 4-step onboarding modal on `/dashboard` before the quiz. State tracked via `/api/lifestyle` (no localStorage).

## Current Flow (All Working)

```
Landing → "Start Quiz" → 9 questions → analyzing spinner
  → rule-based follow-ups (or LLM if key set)
  → matching spinner → /result/latest → 3 ranked matches
  → "Explore This Pet" button per match:
      Auth'd + sub → POST /api/planning → /workspace/[id]
      Not auth'd → Google OAuth with return URL → retry
      No sub → inline subscription prompt → Stripe/demo → retry

First-time login → /dashboard → Onboarding modal (4 slides)
  → Quiz modal → lifestyle profile created → no more onboarding
```

## Critical Files

| File | Purpose |
|------|---------|
| `HANDOFF_NEXT.md` | Full feature status table, API endpoint matrix, remaining tasks |
| `ASSET_GUIDE.md` | Pet image naming, color tokens, nav states, CTA patterns |
| `src/components/onboarding/OnboardingModal.tsx` | 4-step onboarding for first-time users |
| `src/components/onboarding/OnboardingSlide.tsx` | Individual onboarding slide |
| `src/lib/pet-logos.ts` | Shared `getPetLogo(id)` — maps YAML IDs to asset folder paths |
| `src/lib/stripe/guard.ts` | `isSubscriber()` — mock-aware subscription check |
| `src/lib/llm/config.ts` | `callLLM()` — OpenRouter API client |
| `src/lib/matching/engine.ts` | `runMatch()` — 8-dimension scoring engine |
| `src/lib/matching/dimensions.ts` | 8 score dimensions with weights and explanations |
| `src/lib/quiz/questions.ts` | 9 fixed questions + `transformAnswers()` |
| `src/app/api/match/route.ts` | POST — runs match, saves for auth, returns for all |
| `src/app/api/match/follow-up/route.ts` | POST — LLM/rule-based follow-up questions |
| `src/app/quiz/page.tsx` | Phase machine: quiz → analyzing → followup → matching |
| `src/app/result/[id]/page.tsx` | Reads sessionStorage, shows matches, workspace/sub flow |
| `src/app/page.tsx` | Landing — AppNav, 19-pet grid, Start Quiz + Google CTA |
| `src/components/layout/AppNav.tsx` | Auth-aware nav: logged-out vs logged-in states |
| `src/app/dashboard/page.tsx` | Workspace list, onboarding gate, quiz trigger |
| `src/app/api/stripe/checkout/route.ts` | Demo mode without keys, real Stripe with keys |
| `src/app/api/stripe/webhook/route.ts` | Mock fallback when no Stripe keys |
| `src/lib/supabase/middleware.ts` | Protects `/dashboard`, `/workspace`, `/owned` |
| `supabase_schema.sql` | DB schema (run manually in Supabase SQL editor) |

## Known Issues

1. **Pre-existing TS error** in `src/lib/agent/invoke.ts:77` — type cast issue with `ToolMessage`. Not blocking functionality.
2. **Google OAuth** — must be tested manually in browser.
3. **Stripe keys** — add to `.env.local` to activate real payments.
4. **OpenRouter key** — add to `.env.local` to activate real AI agents.
5. **Pet images** — place PNGs in `public/assets/PetLogo/{id}/1.png`.
6. **Design/styling pass** — everything functions, needs visual polish from `design/` HTML files.
7. **Re-seed needed** — after pet name changes, run `GET /api/seed` to push new names to Supabase.

## Suggested Skills

- **`agent-browser`** — Run through full quiz flow, verify result page shows matches with images, test Explore/Subscribe/Create workspace flows
- **`code-review`** — Review current codebase against `design/` specs
- **`diagnosing-bugs`** — Fix the pre-existing TS error in `invoke.ts`
- **`tdd`** — Write integration tests for quiz → match → result pipeline
