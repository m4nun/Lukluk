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
│   ├── page.tsx              # Landing page (Google sign-in)
│   ├── auth/callback/        # OAuth callback
│   ├── auth/google/          # OAuth redirect
│   └── api/
│       ├── agent/chat/       # Decision Agent chat endpoint
│       ├── auth/logout/      # Session logout
│       ├── experiences/      # Owner Experience submission
│       ├── match/            # Quiz → match → save result
│       │   └── follow-up/    # LLM follow-up question round
│       ├── ownership/transition/  # Planning → owned conversion
│       ├── planning/         # Planning Pet Profile CRUD
│       ├── seed/             # YAML → Supabase pipeline
│       └── stripe/           # Checkout + webhook
├── lib/
│   ├── agent/                # LangGraph agent
│   │   ├── repository.ts     # PlanningRepository interface
│   │   ├── supabase-repo.ts  # Supabase adapter
│   │   ├── tools.ts          # Agent tools (factory)
│   │   └── graph.ts          # StateGraph definition
│   ├── matching/             # Matching engine
│   │   ├── engine.ts         # Pure runMatch function
│   │   └── dimensions.ts     # ScoreDimension interface + defaults
│   ├── pipeline/             # YAML validation + seed
│   ├── quiz/questions.ts     # Fixed quiz questions
│   ├── stripe/guard.ts       # Subscription gating
│   ├── supabase/             # Server/client/admin clients
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
| `/api/planning` | GET/POST | Subscriber | List/create planning profiles |
| `/api/agent/chat` | POST | User | Decision Agent conversation |
| `/api/experiences` | POST | Subscriber | Submit owner experience |
| `/api/ownership/transition` | POST | Subscriber | Convert to owned profile |
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
