# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# tech-stack
- Use Next.js as the full-stack framework (monolith with API routes). Confidence: 0.50
- Use Supabase for database, auth, and real-time. Confidence: 0.50
- Use OpenRouter as the LLM provider for AI agents. Confidence: 0.50
- Use Vercel for hosting/deployment. Confidence: 0.50

# agent
See [agent/taste.md](agent/taste.md)
# context-strategy
- For v1: feed all context (Pet Type Profile, Lifestyle Profile, Owner Experiences, session history) into the system prompt — token-expensive but acceptable since DeepSeek Flash v4 is cheap. Confidence: 0.70
- Apply context compacting/summarization when injecting context into agent system prompts, rather than sending raw unprocessed context. Confidence: 0.60

# data-pipeline
- Use a build step to validate YAML Pet Type Profiles and seed Supabase at deploy time (not admin API uploads or runtime repo reads). Confidence: 0.50

# agent-session
- Persist LangGraph agent state in Supabase (checkpoint/session table) between turns, not in-memory or LangGraph's built-in Postgres adapter. Confidence: 0.50

# export-card
- Use the html2canvas pattern from MPTI (github.com/m4nun/MPTI) for Match Card export, built directly into Lukluk as a client-side screenshot (not a separate microservice). Confidence: 0.70

# matching-engine
- Run matching logic server-side via an API route (not client-side) — needed for LLM-based question handling. Confidence: 0.50

# payments
- Use Stripe for payment integration, but for v1 implement only test mode (no live payments). Confidence: 0.70

# content-moderation
- For v1: no moderation/review for owner experience submissions — they go live immediately with no pre-moderation queue or auto-hiding. Confidence: 0.70

# agent-drafts
- If user manually edits a field that has a pending agent draft, discard the stale draft — no merge conflicts, simple last-actor-wins. Confidence: 0.60

# agent-error-handling
- When LLM tool call fails, retry once, then report the error to the user in chat (don't swallow or silently continue). Confidence: 0.70

# quiz-state
- Use React context + sessionStorage during quiz (stateless, no DB writes), save answers to Supabase only once when user gets the result — use saved answers as context for future sessions. Confidence: 0.70

# auth
- Use Google OAuth only for authentication — no email/password signup or login. Confidence: 0.65

# design
- Design work (UI components, page layouts, global states) is handled by the user — do not design or style UI. Focus on engineering tasks only. Confidence: 0.85
- Design handoff: user provides completed designs in the @design directory and assets in @public/assets, then says to wire everything up end-to-end. Confidence: 0.70
- The design/ folder contains ONLY HTML/styling design files. For project context like SQL schemas, config, or code, look in the main project root or sub-projects — never pull engineering artifacts from design/. Confidence: 0.75

# project-artifacts
- Keep handoff/context files in the project directory (e.g., HANDOFF.md, CONTEXT.md), not in temporary locations like %TEMP%. Confidence: 0.65
