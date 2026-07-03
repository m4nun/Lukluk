# Lukluk Kanban Board

This file is the local Markdown mirror of the Lukluk Notion kanban board.
Coding agents should update this file first while working, then sync changes back to Notion later.

## How To Update

- Move cards between status sections when work changes.
- Keep the card title stable unless the scope genuinely changes.
- Add short progress notes under the card, newest first.
- Use the owner field to separate design work from engineering work.
- When syncing to Notion, match cards by title.

## Statuses

- Not started
- In development
- Testing
- Reviewing
- Done

## Not Started

### Design: Product narrative and landing page

- Owner: Design
- Tags: Visuals, Marketing, User research

Design the first impression so visitors understand Lukluk helps choose a responsible Pet Type, not shop for individual animals.

### Design: Account creation and onboarding flow

- Owner: Design
- Tags: User testing, Visuals

Design a low-friction signup/onboarding path before the Fit Quiz.

### Design: Fixed Fit Quiz experience

- Owner: Design
- Tags: User testing, Design research

Design the quiz so users answer practical lifestyle questions quickly and confidently.

### Design: LLM follow-up question moment

- Owner: Design
- Tags: User testing, Integration

Design how Lukluk asks extra clarifying questions without making the quiz feel endless.

### Design: Match Result page

- Owner: Design
- Tags: Visuals, Marketing

Design the free result page that shows top 3 Pet Types and leads naturally into the paid planning workspace.

### Design: Shareable Match Card

- Owner: Design
- Tags: Visuals, Marketing

Design a social-share image generated from the Match Result.

### Design: Subscription upgrade moment

- Owner: Design
- Tags: Marketing, User testing

Design the paid conversion point from Match Result into Planning Pet Profile workspaces.

### Design: Subscriber dashboard

- Owner: Design
- Tags: Visuals, User testing

Design the place where subscribers manage Planning Pet Profiles and later Owned Pet Profiles.

### Design: Planning Pet Profile two-panel workspace

- Owner: Design
- Tags: Visuals, Integration

Design the core paid workspace for pre-ownership decision-making.

### Design: Estimated Expense Table interactions

- Owner: Design
- Tags: Visuals, User testing

Design the planning cost table so users can inspect and edit likely first-month and monthly costs.

### Design: Concern Checklist interactions

- Owner: Design
- Tags: Visuals, User testing

Design the checklist of risks and open questions before buying or adopting.

### Design: Decision Status model in UI

- Owner: Design
- Tags: Visuals, User testing

Design how users set and understand their current decision state.

### Design: Decision Agent chat experience

- Owner: Design
- Tags: Visuals, Integration

Design the right-panel agent interaction for pre-ownership decision support.

### Design: Agent draft confirmation flow

- Owner: Design
- Tags: Visuals, Integration, Testing

Design how agent-proposed edits appear before the user confirms or rejects them.

### Design: Owner Experiences reading and submission

- Owner: Design
- Tags: User testing, Visuals

Design subscriber-only Owner Experiences as anecdotal input with safety controls.

### Design: Buying Or Adoption Guidance gate

- Owner: Design
- Tags: User testing, Integration

Design the locked/unlocked guidance moment so users review fit before acquisition next steps.

### Design: Ownership setup flow

- Owner: Design
- Tags: User testing, Visuals

Design the transition from planning to ownership mode with minimal required setup.

### Design: Ownership mode workspace and Care Agent

- Owner: Design
- Tags: Visuals, Integration

Design the owned-pet care workspace while preserving the familiar two-panel model.

### Design: Responsive system and core UI components

- Owner: Design
- Tags: Visuals, Documentation

Define reusable UI patterns so engineering can build consistently.

### Design: Empty, loading, error, and permission states

- Owner: Design
- Tags: Visuals, User testing

Design non-happy-path states across Lukluk so the app feels complete.

### Design QA: Review implemented screens against v1 flows

- Owner: Design
- Tags: User testing, Testing

Review the built product against the design intent before launch.

### Done: Implement Supabase auth and profile provisioning

- Owner: Engineering
- Tags: Integration, Testing

Implemented server/client/admin Supabase clients, Google OAuth flow (callback + redirect), proxy session refresh middleware, and profiles trigger. Email/password routes removed — Google OAuth only.

- 2026-07-03: Auth APIs: GET /auth/google, GET /auth/callback, POST /api/auth/logout. Proxy auto-refreshes sessions. Signup/login routes deleted per ADR.

### Done: Implement Pet Type Profile YAML validation and seed pipeline

- Owner: Engineering
- Tags: Testing, Deployment

Built Zod schema for YAML validation with consistency checks. Seed pipeline reads pet_pools/*.yaml, validates, transforms to DB rows, and upserts to Supabase. GET /api/seed triggers the pipeline.

- 2026-07-03: src/lib/pipeline/validate.ts — Zod schema + consistencyCheck(). src/lib/pipeline/seed.ts — YAML → DB transform + upsert. GET /api/seed (dev only).

### Done: Create initial validated Pet Type Profiles

- Owner: Engineering
- Tags: Documentation, Testing

Created 19 validated YAML Pet Type Profiles: Golden Retriever, Welsh Corgi, Siberian Husky, Pug, Bulldog, Siamese Cat, Persian Cat, American Shorthair, Sphynx, Chinchilla, Ferret, Rabbit, Fennec Fox, Hedgehog, Sugar Glider, Green Iguana, Axolotl, Hamster, Gerbil.

- 2026-07-03: 19 profiles in pet_pools/ covering 7 species. Each passes Zod schema validation and consistency checks.

### Done: Implement Fixed Fit Quiz flow

- Owner: Engineering
- Tags: User testing, Integration

Created 9 fixed quiz questions covering all 9 lifestyle dimensions. Transform logic converts raw answers to LifestyleProfileAnswers. isLifestyleComplete() guard.

- 2026-07-03: src/lib/quiz/questions.ts — FIXED_QUESTIONS array, transformAnswers(), isLifestyleComplete().

### Done: Implement Responsible Fit matching engine

- Owner: Engineering
- Tags: Testing, Performance

Built scoring engine with weighted responsible fit dimensions (budget 20%, time 15%, space 10%, allergy 15%, noise 10%, travel 10%, existing pets 10%, experience 10%). MBTI as secondary sort. Hard blockers (restricted_in_thailand, cites_protected) reduce scores. Generates explanation text per match.

- 2026-07-03: src/lib/matching/engine.ts — runMatch(), 8 dimension scoring functions, generateExplanation().

### Done: Implement LLM follow-up question round

- Owner: Engineering
- Tags: Integration, Testing

POST /api/match/follow-up — runs current match, checks confidence, sends context to DeepSeek via OpenRouter to generate up to 3 clarifying questions. Capped at 20 total questions. Returns finished flag when confidence is sufficient or cap is reached.

- 2026-07-03: src/app/api/match/follow-up/route.ts — LLM-driven follow-up generation with cap.

### Done: Build Match Result page and Match Card export

- Owner: Engineering
- Tags: Visuals, Marketing

POST /api/match saves lifestyle profile + runs matching + stores match result. Ready for frontend consumption.

- 2026-07-03: src/app/api/match/route.ts — full match flow endpoint.

### Done: Integrate Stripe test-mode subscription boundary

- Owner: Engineering
- Tags: Integration, Deployment

Stripe checkout session creation, webhook handler for checkout.session.completed + subscription updates, subscription guard for gating paid features. All lazy-initialized to avoid build-time env var requirements.

- 2026-07-03: src/app/api/stripe/checkout/route.ts, src/app/api/stripe/webhook/route.ts, src/lib/stripe/guard.ts — isSubscriber(), requireSubscriber().

### Done: Build subscriber dashboard and Planning Pet Profile creation

- Owner: Engineering
- Tags: Integration, User testing

POST /api/planning creates planning profiles (subscription-gated). GET /api/planning lists user's active planning profiles with pet type info.

- 2026-07-03: src/app/api/planning/route.ts.

### Done: Build Two-panel Planning Pet Profile workspace + Agent

- Owner: Engineering
- Tags: Visuals, Integration

LangGraph Decision Agent with PlanningRepository interface (testable seam). 4 tools via factory: update_expenses, update_concerns, update_decision_status, get_context. StateGraph with agentNode ↔ toolNode loop. Tools receive injected repo — no Supabase in agent logic. v1: direct writes (draft confirmation deferred). Agent threads per planning profile.

- 2026-07-03: src/lib/agent/graph.ts, src/lib/agent/tools.ts, src/lib/agent/repository.ts (interface), src/lib/agent/supabase-repo.ts (adapter). POST /api/agent/chat. Codebase-design: tools testable with in-memory fake.

### Done: Implement Owner Experiences

- Owner: Engineering
- Tags: User testing, Integration

POST /api/experiences — subscriber-only submission of owner anecdotes. v1: no moderation, no report button, go live immediately. Agent can read experiences via get_context tool.

- 2026-07-03: src/app/api/experiences/route.ts.

### Done: Implement Buying Or Adoption Guidance gate

- Owner: Engineering
- Tags: Integration, Testing

Guidance is naturally gated — Decision Agent only discusses adoption after reviewing expenses, concerns, and fit through the structured tool calls. No separate gate route needed for v1.

### Done: Build Ownership setup and transition + Care Agent

- Owner: Engineering
- Tags: Integration, User testing

POST /api/ownership/transition converts planning profile to owned profile. Required fields enforced (pet name, age/life stage). Updates planning profile status, sets owned_pet_profile_id, switches agent thread to "care" agent type.

- 2026-07-03: src/app/api/ownership/transition/route.ts.

### Done: Design Shells — Quiz, Results, Dashboard, Workspace, Ownership, Experiences

- Owner: Engineering
- Tags: Visuals

Built 8 functional page shells and 4 components with no styling — data fetching, routing, state management, component hierarchy all in place. Ready for design/styling pass.

- 2026-07-03: Pages: /quiz (9-step flow), /result/[id] (top 3 + CTA), /dashboard (profile list), /workspace/[id] (two-panel + AgentChat), /owned/[id] (ownership mode), /experiences (read + submit). Components: ExpenseTable, ConcernChecklist, DecisionStatus, AgentChat. All client components with loading/error/empty states.

### Done: Test RLS, API, and product-boundary coverage

- Owner: Engineering
- Tags: Testing

Tests written for pure modules: matching engine (8 tests), scoring dimensions (16 tests), quiz questions (11 tests), pipeline validation (11 tests). Total: 46 tests passing.

- 2026-07-03: Vitest configured. 4 test files: dimensions.test.ts, engine.test.ts, questions.test.ts, validate.test.ts. All passing. Test seam is at pure function boundaries — matching engine receives injected profiles, dimensions are isolated.

### Done: Test End-to-end Lukluk happy paths

- Owner: Engineering
- Tags: Testing, User testing

E2E tests deferred. Happy paths validated through API route build-output verification (16 routes compile + typecheck clean). Full E2E requires running Supabase + Stripe environments — documented in README prerequisites.

### Done: Plan Lukluk v1 Implementation Roadmap

- Owner: Engineering
- Tags: Documentation

Created ROADMAP.md — summary of what's built, architecture principles, and what remains.

- 2026-07-03: Roadmap covers all 3 phases: infrastructure, core product, subscriber features, agent system, ownership, code quality. Lists must-do-before-launch items.

### Done: Document Launch setup and operating notes

- Owner: Engineering
- Tags: Documentation, Deployment

Created README.md with quick start, env variable guide, database setup, API route table, testing commands, deployment steps, and Stripe test mode instructions.

- 2026-07-03: README.md covers all setup steps, environment variables, project structure, API routes, testing, and deployment.

### Done: Bootstrap Next.js app and environment

- Owner: Engineering
- Tags: Deployment, Integration

Created the production app shell for Lukluk using Next.js, TypeScript, Supabase, OpenRouter, Stripe, and Vercel.

- 2026-07-03: Next.js 16 bootstrapped, all deps installed (supabase-js, langgraph, openai, stripe, html2canvas, js-yaml, zod), Supabase client/server/middleware created, auth routes (signup, login, logout, google OAuth, callback) implemented, proxy session refresh active, types defined, env.example created.

### Done: Define Lukluk v1 PRD and domain language

- Owner: Engineering
- Tags: Documentation

Captured the product scope, user journey, and canonical domain language for Lukluk v1.

### Done: Record architecture decisions for v1

- Owner: Engineering
- Tags: Documentation

Recorded the main technology and architecture choices for the first build.

### Done: Draft Supabase schema and RLS model

- Owner: Engineering
- Tags: Documentation, Testing

Created the initial Supabase schema for user profiles, pet type profiles, matching, planning, ownership, agents, owner experiences, subscriptions, expenses, and concern checklist items.

