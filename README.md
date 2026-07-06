# Lukluk 🐾

Help people choose a suitable pet type before ownership, then support care after ownership.

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd Lukluk
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in all values (see Environment Variables below)

# 3. Run tests
npm test

# 4. Start dev server
npm run dev
```

## Environment Variables

Create `.env.local` from `.env.example`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM access |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) or production URL |

## Database Setup

1. Create a Supabase project
2. Run `supabase_schema.sql` in the SQL Editor
3. The schema creates 12 tables with RLS, triggers, and indexes
4. Tables auto-created by LangGraph: `checkpoints`, `checkpoint_blobs`, `checkpoint_writes`

**Auth**: Enable Google OAuth in Supabase Dashboard → Authentication → Providers.

## Seed Pet Type Profiles

```
GET /api/seed
```

Reads all YAML files in `pet_pools/`, validates against Zod schema, runs consistency checks, and upserts into `pet_type_profiles`. Only available in development.

## Architecture

See `ROADMAP.md` for a complete overview. Key principles:

- **Pure functions at seams** — matching engine, quiz transforms, validators are pure
- **Inject dependencies** — repo, tools, dimensions are injected, not imported
- **Interface before implementation** — `PlanningRepository`, `ScoreDimension` define the contract
- **Google OAuth only** — no email/password auth

### Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (hero, pet grid, CTA)
│   ├── layout.tsx            # Root layout (Geist fonts)
│   ├── globals.css           # Tailwind config + animations
│   ├── auth/
│   │   ├── google/           # Google OAuth redirect
│   │   └── callback/         # OAuth callback handler
│   ├── quiz/page.tsx         # 9-step quiz with phase machine
│   ├── result/[id]/page.tsx  # Match result with top 3 + Match Card
│   ├── dashboard/page.tsx    # Workspace list + onboarding gate
│   ├── workspace/[id]/       # Two-panel planning workspace + agent
│   ├── owned/[id]/           # Ownership mode workspace
│   ├── pet/[slug]/           # Pet detail page
│   ├── experiences/          # Owner Experience reading/submission
│   ├── pricing/              # Subscription pricing page
│   ├── profile/              # User profile page
│   └── api/
│       ├── agent/chat/       # Decision Agent chat endpoint
│       ├── agent/care/       # Care Agent endpoint (stub)
│       ├── auth/logout/      # Session logout
│       ├── experiences/      # Owner Experience CRUD
│       ├── lifestyle/        # Lifestyle profile check
│       ├── match/            # Quiz → match → save
│       │   └── follow-up/    # LLM follow-up question round
│       ├── ownership/transition/  # Planning → owned conversion
│       ├── pet/[slug]/       # Pet profile by slug
│       ├── planning/         # Planning Pet Profile CRUD
│       ├── profile/          # User profile
│       ├── seed/             # YAML → Supabase pipeline
│       └── stripe/           # Checkout + webhook
├── components/
│   ├── onboarding/           # OnboardingModal, OnboardingSlide
│   ├── quiz/                 # QuizModal
│   ├── modals/               # ExplorePetModal
│   ├── layout/               # AppNav, LoadingSkeleton, etc.
│   ├── match-card/           # Match Card export (html2canvas)
│   ├── pet/                  # Pet display components
│   ├── workspace/            # ExpenseTable, ConcernChecklist, etc.
│   ├── ui/                   # 17 shadcn/ui components
│   └── agent/                # AgentChat components
├── hooks/
├── lib/
│   ├── agent/                # LangGraph agent system
│   │   ├── graph.ts          # StateGraph definition
│   │   ├── tools.ts          # 4 tools (factory)
│   │   ├── repository.ts     # PlanningRepository interface
│   │   └── supabase-repo.ts  # Supabase adapter
│   ├── matching/             # Pure matching engine
│   │   ├── engine.ts         # runMatch() — 8-dimension scoring
│   │   └── dimensions.ts     # ScoreDimension interface + defaults
│   ├── llm/config.ts         # callLLM() — OpenRouter client
│   ├── pipeline/             # YAML validation + seed
│   ├── quiz/questions.ts     # 9 fixed questions + transformAnswers()
│   ├── stripe/guard.ts       # isSubscriber(), requireSubscriber()
│   ├── supabase/             # Server/client/admin clients
│   ├── pet-logos.ts          # Shared getPetLogo() mapping
│   └── types.ts              # Domain types
└── proxy.ts                  # Session refresh proxy
```

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/auth/google` | GET | None | Start Google OAuth |
| `/auth/callback` | GET | None | Handle OAuth callback |
| `/api/auth/logout` | POST | User | End session |
| `/api/match` | POST | User | Quiz → match → save |
| `/api/match/follow-up` | POST | User | LLM follow-up questions |
| `/api/match/[id]` | GET | User | Get match result by ID |
| `/api/lifestyle` | GET | User | Check if lifestyle profile exists |
| `/api/pet/[slug]` | GET | None | Get pet profile by slug |
| `/api/planning` | GET/POST | Subscriber | List/create planning profiles |
| `/api/agent/chat` | POST | User | Decision Agent conversation |
| `/api/agent/care` | POST | User | Care Agent conversation (stub) |
| `/api/agent/drafts` | POST | User | Agent draft proposals |
| `/api/experiences` | GET/POST | GET: None / POST: Sub | Owner experiences |
| `/api/ownership/[id]` | GET | User | Get owned profile |
| `/api/ownership/transition` | POST | Subscriber | Convert to owned profile |
| `/api/profile` | GET/POST | User | User profile |
| `/api/stripe/checkout` | POST | User | Create checkout session |
| `/api/stripe/webhook` | POST | Stripe | Handle Stripe events |
| `/api/seed` | GET | Dev only | Seed pet profiles |

## Testing

```bash
npm test        # Run all tests once
npm run test:watch  # Watch mode
```

46 tests across 4 suites:
- `matching/dimensions.test.ts` — 16 tests (weights, scoring, explanations)
- `matching/engine.test.ts` — 8 tests (sorting, penalties, custom dimensions)
- `quiz/questions.test.ts` — 11 tests (transforms, completeness checks)
- `pipeline/validate.test.ts` — 11 tests (schema validation, consistency)

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Set all environment variables in Vercel dashboard
4. Run DB schema on Supabase
5. Deploy
6. Seed profiles: `curl https://your-app.vercel.app/api/seed` (remove dev-only guard)

## Stripe Test Mode

In development, use [Stripe test cards](https://stripe.com/docs/testing):
- Card: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits

Webhook forwarding: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
