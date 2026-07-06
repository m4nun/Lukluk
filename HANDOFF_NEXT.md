# Lukluk Handoff — 2026-07-06

## Current State

- **Clean build**, 46 tests passing across 4 suites
- **19 pet profiles** seeded in Supabase (pet_type_profiles table) with short & punchy names
- **All 9 pages**: Landing, Quiz, Result, Dashboard, Workspace, Owned, Experiences, Pet Detail, Auth Callback
- **All APIs working**: match, follow-up, pet, experiences, planning, stripe, agents, ownership
- **`.env.local`** configured (Supabase, no OpenRouter, no Stripe)

## Pet Type Names (Short & Punchy)

| Pet Type | Display Name | Slug |
|----------|-------------|------|
| Golden Retriever | Golden Gentleman | golden-retriever |
| Siamese Cat | Sassy Siamese | siamese-cat |
| Persian Cat | Fluffy Persian | persian-cat |
| American Shorthair | Cool Cat Shorthair | american-shorthair |
| Sphynx Cat | Naked Noble | sphynx |
| Bulldog | Buff Bulldog | bulldog |
| Pug | Party Pug | pug |
| Siberian Husky | Snow Explorer | siberian-husky |
| Welsh Corgi | Royal Corgi | welsh-corgi |
| Hamster | Pocket Rocket | hamster |
| Gerbil | Gerbil Ninja | gerbil |
| Rabbit | Hop Star | rabbit |
| Chinchilla | Cloud Chinchilla | chinchilla |
| Ferret | Ferret Ninja | ferret |
| Hedgehog | Spikestar | hedgehog |
| Sugar Glider | Sugar Glider Ace | sugar-glider |
| Fennec Fox | Fennec Flash | fennec-fox |
| Green Iguana | Iguana King | green-iguana |
| Axolotl | Axolotl Angel | axolotl |

## Full User Flow

```
Guest Flow (no login needed):
  / → Start Quiz → 9 questions → analyzing → rule-based follow-ups
  → matching → /result/latest → 3 ranked matches with scores

First-time Login Flow:
  / → Sign in with Google → /auth/callback → /dashboard
  → Onboarding modal (4 slides) → Quiz modal → lifestyle profile created
  → Dashboard with workspaces

Returning Login Flow:
  / → Sign in with Google → /dashboard → existing workspaces
  → Retake Quiz or open workspace
  → Agent Chat → DecisionStatus → Ownership Form → /owned/[id]
  → Owned → Care Agent → expenses/schedules/food tabs
```

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | Done | 19 pets, Start Quiz + Google CTA |
| Onboarding modal | Done | 4-step modal on dashboard before quiz for first-time users |
| Quiz (9 questions) | Done | Auto-triggers finish on Q9 |
| LLM follow-ups | Done | Rule-based fallback works without OpenRouter key |
| Matching engine | Done | 8-dimension scoring, returns top 3 |
| Result page | Done | sessionStorage for guests, API for auth |
| Dashboard | Done | Lists workspaces, onboarding gate, Retake Quiz button |
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
4. **Re-seed pet profiles** — After pet name changes: `GET /api/seed`
5. **Design styling/finishing** — Everything functional, needs visual polish

## API Endpoints Summary

| Method | Route | Auth | Sub | Status |
|--------|-------|------|-----|--------|
| POST | /api/match | No | No | 200 |
| POST | /api/match/follow-up | No | No | 200 |
| GET | /api/match/[id] | Yes | No | 200 |
| GET | /api/lifestyle | Yes | No | 200 |
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

## Known Issues

1. **Pre-existing TS error** in `src/lib/agent/invoke.ts:77` — type cast issue with `ToolMessage`. Not blocking functionality.

## Remaining (styling/design tasks only)

- Polish landing hero spacing and typography
- Fix heading text rendering (React text nodes sometimes merge spans)
- Add loading transitions between quiz phases
- Wire up real pet images in public/assets/PetLogo/
- Apply visual polish from `design/` HTML mockups to all pages
