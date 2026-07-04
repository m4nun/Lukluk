# Lukluk Handoff — 2026-07-03

## Current Focus

The **design pass** is the next major work item. Engineering is 100% complete (23 routes, 46 tests, 16 API endpoints). The front-end has functional page shells with no styling.

The merged design file `lukluk-design-task.html` in the project root explains exactly what to design vs. what's already done via AI SDK Elements.

## What's Built

- **Backend**: 100% complete. 16 API routes, matching engine, quiz, agent system (Decision + Care with draft workflow), Stripe test mode, seed pipeline.
- **Tests**: 46 tests passing (matching engine 8, dimensions 16, quiz 11, validation 11). No tests for agent/draft/API modules.
- **Frontend**: 7 page shells + 9 components with functional data flow, routing, state management. Zero styling (inline `style={{}}` objects).
- **Data**: 19 validated Pet Type Profiles in YAML, 12-table Supabase schema with full RLS.
- **Agents**: LangGraph-based Decision Agent and Care Agent, non-streaming JSON API.

## What I Just Did (This Session)

1. **Set up shadcn/ui infrastructure**: `components.json`, `cn()` utility in `src/lib/utils.ts`, full CSS variable theming in `src/app/globals.css` (light/dark mode), 17 shadcn UI primitives.

2. **Installed AI SDK Elements**: `ai-elements@1.9.0` plus all dependencies (use-stick-to-bottom, streamdown, nanoid, @streamdown/* packages, tw-animate-css).

3. **Refactored AgentChat.tsx** to use Elements: Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton, Message, MessageContent, Suggestions, Suggestion, Spinner. Replaced ~110 lines of inline-style chat code.

4. **Refactored CareChat.tsx** — same treatment with Elements, domain-specific suggestions ("Track an expense", "Build a daily routine", "What food should I buy?").

5. **Fixed type errors**:
   - Added `icon-sm` size variant to Button component (required by ai-elements)
   - Removed unused `size` prop from CodeBlockLanguageSelectorTrigger in code-block.tsx

6. **Verified build**: Clean compile, all 23 routes, zero type errors.

7. **Created `lukluk-design-task.html`** in project root — merged design-guide.html + design-plan.html explaining exactly what needs design (6 custom components + 7 page layouts + 4 global states) vs. what's done (5 AI Elements components).

## What AI Elements Handle (Done)

| Component | Status |
|-----------|--------|
| Conversation (auto-scroll, empty state) | Wired in both AgentChat + CareChat |
| Message / MessageContent (bubbles) | Wired in both AgentChat + CareChat |
| Suggestion (quick reply chips) | Wired with domain-specific suggestions |
| Tool (inline tool call display) | Installed, NOT wired (needs streaming API) |
| Confirmation (inline accept/reject) | Installed, NOT wired (needs streaming API) |
| PromptInput (input + submit) | Installed; using shadcn Input+Button instead (compatible with current non-streaming API) |

## What Still Needs Design

**6 Custom Components** (all in `src/components/workspace/` or inline):
1. `ExpenseTable.tsx` — categorized expense table with subtotals
2. `ConcernChecklist.tsx` — colored status dots + summary
3. `DecisionStatus.tsx` — dropdown with 5 status options
4. `GuidanceGate.tsx` — locked/unlocked two-state panel
5. `MatchCard.tsx` — 1280×720 html2canvas export card
6. `OwnershipForm` (inline in workspace page) — pet name + life stage dropdown

**7 Page Layouts**:
1. `src/app/page.tsx` — Landing (hero, how-it-works, sign-in)
2. `src/app/quiz/page.tsx` — Quiz (progress bar, answer cards, finish screen)
3. `src/app/result/[id]/page.tsx` — Match Result (top 3 cards, subscription CTA)
4. `src/app/dashboard/page.tsx` — Dashboard (profile cards, empty state)
5. `src/app/workspace/[id]/page.tsx` — Two-panel workspace (most complex)
6. `src/app/owned/[id]/page.tsx` — Two-panel ownership
7. `src/app/experiences/page.tsx` — Owner Experiences (form + card list)

**4 Global States** (design once):
- Loading (skeleton, spinner)
- Empty (CTA-driven)
- Error (red card + retry)
- Unauthorized (redirect/sign-in prompt)

## Deferred

- **Tool + Confirmation in chat**: Installed but need streaming API upgrade. Current API returns `{ response: string }` (non-streaming LangGraph). The `DraftPanel` (5s polling + amber panel) handles accept/reject for now.
- **PromptInput composite**: Using shadcn Input + Button instead. Swap when streaming is ready.

## Architecture Notes

- See `ROADMAP.md` for architecture overview and principles
- See `ADR.md` for 13 architecture decision records
- See `PRD.md` for 48 user stories and implementation decisions
- See `CONTEXT.md` for domain glossary
- See `KANBAN.md` for full kanban board (18 design cards in "Not Started")
- See `HANDOFF.md` for previous handoff (engineering complete)
- See `lukluk-design-task.html` for merged design task breakdown

## Environment

- `.env.example` has all needed vars (Supabase, OpenRouter, Stripe)
- Build: `npm run build` (clean)
- Tests: `npm test` (46 passing)
- Dev: `npm run dev`

## Suggested Skills

- **`design`** — Primary. Design the UI for all 6 custom components + 7 pages + 4 global states. Use the merged `lukluk-design-task.html` as reference.
- **`tdd`** — Write tests for agent, draft, and API modules (current gap: no tests outside pure functions)
- **`to-issues`** — Create GitHub issues from the KANBAN.md design cards
- **`code-review`** — Review implementation against PRD and ADR if needed
