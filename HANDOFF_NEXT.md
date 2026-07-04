# Lukluk Handoff — 2026-07-05

## Current State

- **12 commits on `master`**, clean build, 0 TypeScript errors
- **19 pet profiles** seeded in Supabase (pet_type_profiles table)
- **All 9 pages**: Landing, Quiz, Result, Dashboard, Workspace, Owned, Experiences, Pet Detail, Auth Callback
- **All APIs working**: match, follow-up, pet, experiences, planning, stripe, agents, ownership
- **Stripe MCP** connected to Command Code
- **`.env.local`** configured (Supabase, no OpenRouter, no Stripe)

## Full User Flow

```
Guest Flow (no login needed):
  / → Start Quiz → 9 questions → analyzing → rule-based follow-ups
  → matching → /result/latest → 3 ranked matches with scores

Authenticated Flow:
  / → Sign in with Google → /auth/callback → /dashboard
  Dashboard → Retake Quiz (or existing workspaces)
  Workspace → Agent Chat → DecisionStatus → Ownership Form → /owned/[id]
  Owned → Care Agent → expenses/schedules/food tabs
```

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | Done | 19 pets, Start Quiz + Google CTA |
| Quiz (9 questions) | Done | Auto-triggers finish on Q9 |
| LLM follow-ups | Done | Rule-based fallback works without OpenRouter key |
| Matching engine | Done | 8-dimension scoring, returns top 3 |
| Result page | Done | sessionStorage for guests, API for auth |
| Dashboard | Done | Lists workspaces, Retake Quiz button |
| Workspace | Auth only | Expenses, concerns, decision status, agent chat |
| Owned profile | Auth only | Expenses, activity schedule, food guide, care agent |
| Experiences | Public GET | Auth+sub for POST (sub mock when no Stripe) |
| Pet detail pages | Done | Full profile + owner experiences at bottom |
| Google OAuth | Ready | Needs manual browser login |
| Stripe checkout | Mock ready | Returns demo URL, plugs real keys instantly |
| Agent chat | Stub | Returns helpful placeholder, plugs OpenRouter key |

## What You Need for Production

1. **Google OAuth login** — Sign in manually in browser at localhost:3000
2. **Stripe keys** — Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. **OpenRouter key** (for AI agents) — Add to `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-...
   ```
4. **Design styling/finishing** — Everything functional, needs visual polish

## API Endpoints Summary

| Method | Route | Auth | Sub | Status |
|--------|-------|------|-----|--------|
| POST | /api/match | No | No | 200 |
| POST | /api/match/follow-up | No | No | 200 |
| GET | /api/match/[id] | Yes | No | 200 |
| GET | /api/pet/[slug] | No | No | 200 |
| GET | /api/experiences | No | No | 200 |
| POST | /api/experiences | Yes | Mock | 200 |
| GET | /api/planning | Yes | No | 200 |
| POST | /api/planning | Yes | Mock | 200 |
| POST | /api/agent/chat | Yes | Mock | 200 (stub) |
| POST | /api/agent/care | Yes | Mock | 200 (stub) |
| POST | /api/agent/drafts | Yes | No | 200 |
| GET | /api/ownership/[id] | Yes | No | 200 |
| POST | /api/ownership/transition | Yes | Mock | 200 |
| POST | /api/stripe/checkout | Yes | No | 200 (demo) |
| GET | /api/seed | No | No | 200 |

## Remaining (styling/design tasks only)

- Polish landing hero spacing and typography
- Fix heading text rendering (React text nodes sometimes merge spans)
- Add loading transitions between quiz phases
- Wire up real pet images in public/assets/PetLogo/
