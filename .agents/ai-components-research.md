# Research: Built-in UI Components for AI Agents

**Context**: Lukluk v1 — the workspace pages need chat, structured data displays (tables, checklists), draft panels, and guidance gates. This research explores existing component libraries for AI interfaces.

**Sources**: Vercel AI SDK Elements docs ([elements.ai-sdk.dev](https://elements.ai-sdk.dev)), Vercel AI SDK 5 blog ([vercel.com/blog/ai-sdk-5](https://vercel.com/blog/ai-sdk-5)), Vercel Academy ([vercel.com/academy/ai-sdk/ai-elements](https://vercel.com/academy/ai-sdk/ai-elements))

---

## 1. Vercel AI SDK Elements (Recommended)

20+ production-ready React components built on **shadcn/ui**, designed specifically for AI interfaces. Fully composable, dark mode support, AI SDK integration.

**Install**:
```bash
npx ai-elements@latest add conversation message prompt-input
```

All components live in `components/ai-elements/` with full source code access.

### Chat Components

| Component | Use in Lukluk |
|-----------|---------------|
| `Conversation` | Auto-scrolling chat container — replaces manual `useRef` scroll |
| `ConversationContent` | Wraps message list |
| `ConversationScrollButton` | Scroll-to-bottom button |
| `ConversationEmptyState` | "No messages yet" state |
| `Message` | Message bubble with `from` prop (`"user"` / `"assistant"`) |
| `MessageContent` | Content wrapper inside a message |
| `MessageResponse` | Markdown renderer with syntax highlighting — handles streaming |
| `PromptInput` | Smart input with auto-resize |
| `PromptInputTextarea` | Textarea inside PromptInput |
| `PromptInputSubmit` | Submit button with loading state |
| `PromptInputFooter` | Footer area for tools/buttons |

**Lukluk mapping**: Replace current `AgentChat` and `CareChat` components. Both are nearly identical — Elements would give them professional chat UI with ~30 lines each.

### Tool & Reasoning Components

| Component | Use in Lukluk |
|-----------|---------------|
| `Tool` | Displays tool usage in conversations — show when agent calls `update_expenses`, `update_concerns`, etc. |
| `Reasoning` | Shows AI thought processes before the response — could show the agent's decision reasoning |
| `ReasoningTrigger` | Expand/collapse for reasoning panel |
| `ReasoningContent` | Content of reasoning |

**Lukluk mapping**: Show tool calls inline in the chat (e.g., "🔧 Updated 5 expense items" before the text response). The `Tool` component handles the different states: `input-streaming`, `input-available`, `output-available`, `output-error`.

### Other Chat Components

| Component | Use in Lukluk |
|-----------|---------------|
| `Suggestion` | Quick reply buttons below chat input — could suggest "Show me costs", "What are the concerns?" |
| `Sources` | Source references — could show which Owner Experiences were consulted |
| `ChainOfThought` | Visualize reasoning steps |
| `Confirmation` | Confirm/reject prompts — **potential replacement for DraftPanel** |
| `Checkpoint` | Save/restore conversation state |

### Code/IDE Components (less relevant but available)

| Component | Description |
|-----------|-------------|
| `CodeBlock` | Syntax-highlighted code blocks |
| `FileTree` | File tree browser |
| `Terminal` | Terminal output display |
| `SchemaDisplay` | Display structured schemas |

### Workflow Components

| Component | Description |
|-----------|-------------|
| `Canvas` | Interactive workflow canvas |
| `Node` / `Edge` | Workflow graph nodes/edges |
| `Panel` | Resizable panel |
| `Toolbar` | Workflow toolbar |

### Utility Components

| Component | Description |
|-----------|-------------|
| `Image` | Image display with zoom |
| `OpenInChat` | Open item in chat button |
| `Shimmer` | Loading skeleton animation |

---

## 2. AI SDK 5 — Programmatic Features (Complements Elements)

The underlying SDK provides type-safe primitives that Elements visualizes:

### Data Parts
Stream arbitrary typed data from server to client alongside text responses. Could stream tool call progress directly.

```ts
// Server
writer.write({
  type: 'data-weather',
  id: 'weather-1',
  data: { city: 'San Francisco', status: 'loading' },
});
// Later update same part:
writer.write({
  type: 'data-weather',
  id: 'weather-1',  // same ID = replaces previous
  data: { city: 'San Francisco', weather: 'sunny', status: 'success' },
});
```

**Lukluk use**: Stream tool execution status to `DraftPanel` without polling every 5 seconds. Replace the current polling pattern with push-based updates.

### Tool Invocation States
Type-safe tool display with states:
- `input-streaming` — tool is receiving arguments
- `input-available` — tool has args, about to execute
- `output-available` — tool execution complete
- `output-error` — tool execution failed

### UIMessage vs ModelMessage
- `UIMessage` — source of truth for app state, includes metadata, tool results
- `ModelMessage` — optimized for sending to LLMs

### stopWhen / prepareStep
Agent loop control — could replace LangGraph for simpler single-turn agents:
```ts
const result = await generateText({
  model: 'gpt-4o',
  tools: { /* ... */ },
  stopWhen: [stepCountIs(5), hasToolCall('finalAnswer')],
});
```

---

## 3. What Lukluk Could Use vs. Build Itself

| Feature | Use Elements | Keep Custom | Why |
|---------|-------------|-------------|-----|
| Chat UI (`AgentChat`, `CareChat`) | ✅ | | Conversation + Message + PromptInput = production chat in ~30 lines |
| Markdown rendering | ✅ | | `MessageResponse` handles streaming markdown, code blocks |
| Tool call display | ✅ | | `Tool` component with type-safe states |
| Message persistence | ✅ | | `onFinish` callback + `UIMessage` → save to Supabase |
| ExpenseTable | | ✅ | Custom data — Elements has no table/spreadsheet component |
| ConcernChecklist | | ✅ | Custom data — specific status colors and structure |
| DecisionStatus dropdown | | ✅ | Simple select — no AI-specific component needed |
| DraftPanel | ✅ | | `Confirmation` component handles accept/reject — or keep custom |
| GuidanceGate | | ✅ | Custom state machine — only 2 states |
| MatchCard export | | ✅ | Custom canvas/html2canvas — no AI component for this |

---

## 4. Recommendation

**Install Elements for chat components**: `Conversation`, `Message`, `MessageResponse`, `PromptInput`, `PromptInputTextarea`, `PromptInputSubmit`, `Tool`, `Suggestion`.

This replaces ~200 lines of manual chat code in `AgentChat.tsx` + `CareChat.tsx` with ~60 lines of professional, accessible, dark-mode-ready chat UI.

**Keep custom components for**: `ExpenseTable`, `ConcernChecklist`, `DecisionStatus`, `DraftPanel`, `GuidanceGate`, `MatchCard`. These are domain-specific and have no direct Elements equivalent.

**Future**: If adopting AI SDK 5, use `data parts` to stream tool progress to `DraftPanel` instead of polling. Use `stopWhen` + `prepareStep` if moving away from LangGraph for simpler agent loops.

---

## Sources

- AI Elements docs: [elements.ai-sdk.dev](https://elements.ai-sdk.dev) — component catalog, examples, API reference
- AI SDK 5 blog: [vercel.com/blog/ai-sdk-5](https://vercel.com/blog/ai-sdk-5) — redesigned chat, agentic loop control, data parts, tool improvements
- AI SDK Academy: [vercel.com/academy/ai-sdk/ai-elements](https://vercel.com/academy/ai-sdk/ai-elements) — step-by-step tutorial replacing custom chat with Elements
