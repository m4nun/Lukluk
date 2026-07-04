# Architecture Decision Record — Lukluk v1

## Decisions (grilled 2026-07-03)

### D1: Tech Stack
**Decision**: Next.js monolith with API routes, Supabase (database + auth + real-time), OpenRouter (LLM provider), Vercel (hosting).
**Rationale**: Solo developer, tight timeline. Next.js + Supabase + Vercel is the fastest path from zero to production. OpenRouter gives model flexibility without vendor lock-in.
**Trade-off**: Monolith now; can split into microservices later if needed.

### D2: Agent Framework
**Decision**: Vercel AI SDK + LangGraph, embedded directly in the Next.js app (not a separate backend service).
**Rationale**: Vercel AI SDK provides streaming and tool-calling primitives. LangGraph handles stateful multi-turn agent sessions. Embedding in the Next.js monolith avoids infrastructure overhead.
**Trade-off**: Agent logic is coupled to Next.js routes; heavier server functions.

### D3: Agent Edit Drafts
**Decision**: Agent generates edits via function/tool calls — LLM calls tools via API, backend processes into draft state, user confirms before save. Drafts stored in a separate `agent_drafts` table.
**Rationale**: Tool calls give structured, validated edits. Separate drafts table avoids JSONB merging headaches, survives refresh, supports multiple pending drafts, trivial to clean up.
**Trade-off**: One extra table vs. simpler in-memory or JSONB approaches.

### D4: LLM Context Strategy
**Decision**: For v1, feed all context (Pet Type Profile, Lifestyle Profile, Owner Experiences, session history) into the system prompt with context compacting/summarization applied when injection exceeds token budget.
**Rationale**: DeepSeek Flash v4 is cheap enough that raw context injection is acceptable for v1. Compacting is applied rather than raw unprocessed injection to keep prompts manageable.
**Trade-off**: Higher token spend vs. RAG complexity. Revisit when context grows or costs matter.

### D5: Pet Type Profile Pipeline
**Decision**: Build step validates YAML Pet Type Profiles and seeds Supabase at deploy time.
**Rationale**: Single source of truth (repo YAML files), validation before deployment, no runtime repo reads, no admin upload API complexity.
**Trade-off**: Profile changes require a deploy.

### D6: Agent Session Persistence
**Decision**: LangGraph agent state persisted in Supabase (checkpoint/session table) between turns.
**Rationale**: Survives deploys and server restarts. Uses existing Supabase infra rather than LangGraph's built-in Postgres adapter or in-memory state.
**Trade-off**: Custom persistence logic vs. LangGraph's built-in adapter.

### D7: Match Card Export
**Decision**: Client-side screenshot via html2canvas, built directly into Lukluk (pattern from MPTI repo).
**Rationale**: Free-tier-friendly, no server-side rendering cost, proven pattern from existing project.
**Trade-off**: Client-side only; quality depends on browser rendering.

### D8: Matching Engine
**Decision**: Server-side via API route.
**Rationale**: LLM follow-up questions need the API key server-side. Hides scoring logic from the client.
**Trade-off**: Adds latency and server compute cost vs. client-side matching.

### D9: LLM Follow-Up Questions
**Decision**: Send borderline/uncertain answers to the LLM with a prompt to generate up to 3 clarifying questions that could change the top 3 result — no rule-based pre-filtering.
**Rationale**: Simpler than maintaining a rule engine. The LLM is good at identifying ambiguity. Constraint: only questions that could change top 3 or responsible-fit constraints.
**Trade-off**: LLM cost per follow-up round; risk of unnecessary questions if prompt isn't tight.

### D10: Subscriptions / Payments
**Decision**: Stripe, test mode only for v1.
**Rationale**: Best DX with Next.js + Supabase tutorials. No live payment complexity until launch.
**Trade-off**: Live payments deferred to later.

### D12: Agent Framework Implementation
**Decision**: LangGraph as primary agent runtime (owns graph, tool loop, checkpointing). Custom SSE streaming API route. Custom `useAgentChat` hook on client. PostgresSaver (`@langchain/langgraph-checkpoint-postgres`) for Supabase persistence.
**Rationale**: LangGraph and Vercel AI SDK don't natively interop — `useChat` from AI SDK expects a specific streaming protocol that differs from LangGraph's event format. LangGraph-dominant with custom bridge is simpler than forcing compatibility. PostgresSaver connects directly to Supabase PostgreSQL (3 tables: checkpoints, checkpoint_blobs, checkpoint_writes).
**Trade-off**: Custom hook (~50 lines) instead of using AI SDK's `useChat` directly. Node.js runtime required (not Edge) due to `pg` driver dependency.

### D13: Database Schema
**Decision**: 12 tables across 6 zones: Auth (profiles), Static (pet_type_profiles), User Data (lifestyle_profiles, match_results, planning_pet_profiles, owned_pet_profiles), Agent (agent_threads, agent_drafts, estimated_expenses, concern_checklist_items), Content (owner_experiences), Payments (subscriptions). All tables have RLS enabled with per-role policies. Triggers for auto-profile creation, is_latest management, and updated_at timestamps.
**Rationale**: Clean separation of concerns. Normalized tables for agent tool call targets (estimated_expenses, concern_checklist_items) mirror denormalized JSONB in planning_pet_profiles for snapshot queries. Agent drafts live in their own table per D3.
**Trade-off**: 12 tables is more than strictly necessary for v1, but avoids painful schema migrations later.

### D11: Context Compacting
**Decision**: Apply context compacting/summarization when injecting context into agent system prompts, rather than sending raw unprocessed context.
**Rationale**: Keeps prompts manageable as session history grows. LangGraph checkpoint pattern: summarize old turns, keep recent ones fresh.
**Trade-off**: Summarization quality varies; important details may be lost.
