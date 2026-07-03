# Agent Framework Research: Vercel AI SDK + LangGraph + Next.js 14 + Supabase

> **Context**: Lukluk v1 — Decision Agent & Care Agent for pet matching/ownership.
> **Constraints**: Solo developer, Next.js monolith, Supabase (auth + DB), OpenRouter (LLM), Vercel hosting.
> **Goal**: Simplest possible implementation of a stateful conversational agent with tool calling and streaming.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Next.js 14 App Router                              │
│                                                     │
│  ┌──────────────────┐    ┌───────────────────────┐  │
│  │  Client Component │◄──►│  API Route            │  │
│  │  (useChat hook)   │    │  /api/agent/route.ts  │  │
│  │                   │    │                       │  │
│  │  - Chat UI        │    │  ┌─────────────────┐  │  │
│  │  - Tool status    │    │  │  LangGraph       │  │  │
│  │  - Streaming text │    │  │  StateGraph      │  │  │
│  └──────────────────┘    │  │                  │  │  │
│                           │  │  agentNode ──────┤  │  │
│                           │  │  (LLM + tools)   │  │  │
│                           │  │        │         │  │  │
│                           │  │  toolNode        │  │  │
│                           │  │  (execute tools) │  │  │
│                           │  │        │         │  │  │
│                           │  │  PostgresSaver ──┼──┼──► Supabase
│                           │  └─────────────────┘  │  │  (PostgreSQL)
│                           └───────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Key decision**: Use LangGraph as the primary agent runtime (it owns the graph, tool loop, and checkpointing). Use Vercel AI SDK for the client hook (`useChat`) and optionally for LLM calls. Bridge them via a thin API route that streams LangGraph events in AI SDK-compatible format.

---

## 2. Vercel AI SDK — Minimal Setup for Server-Side AI Calls

### 2.1 Core Functions

The AI SDK (`ai` package, v3+) provides two main server-side functions:

| Function | Use Case | When to Use |
|----------|----------|-------------|
| `generateText()` | Single-turn, non-streaming | Background jobs, batch processing, tool calls where you need the full result |
| `streamText()` | Streaming responses | Chat UI, real-time tool call progress |

### 2.2 Minimal `streamText` with Tool Calling

```typescript
// app/api/chat/route.ts
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai'; // or OpenRouter-compatible provider
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),  // or from OpenRouter
    messages,
    tools: {
      getWeather: tool({
        description: 'Get weather for a city',
        parameters: z.object({
          city: z.string(),
          unit: z.enum(['celsius', 'fahrenheit']).optional(),
        }),
        execute: async ({ city, unit }) => {
          // Your tool implementation
          return { temp: 22, condition: 'sunny' };
        },
      }),
    },
    maxSteps: 5,  // Max tool-calling rounds (prevents infinite loops)
  });

  return result.toDataStreamResponse();
}
```

### 2.3 Client-Side Hook

```typescript
// components/Chat.tsx
'use client';
import { useChat } from 'ai/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, addToolResult } = useChat({
    api: '/api/chat',
    maxSteps: 5,  // Client-side max tool rounds
  });

  // messages includes tool invocations and results
  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.role}: {m.content}
          {/* Tool calls show in m.toolInvocations */}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}
```

### 2.4 OpenRouter Provider

For OpenRouter (as specified in ADR D1), use the `@ai-sdk/openai` compatible provider or the community `@openrouter/ai-sdk-provider`:

```typescript
// lib/ai-provider.ts
import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  // Optional: add OpenRouter-specific headers
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
    'X-Title': 'Lukluk',
  },
});
```

### 2.5 Minimal `generateText` (Non-Streaming)

```typescript
import { generateText, tool } from 'ai';
import { z } from 'zod';

const { text, toolCalls, toolResults } = await generateText({
  model: openrouter('deepseek/deepseek-chat'),
  messages: [...],
  tools: { /* same tool definitions */ },
  maxSteps: 5,
});
```

---

## 3. LangGraph — Minimal Stateful Agent Setup

### 3.1 Core Concepts

| Concept | What It Is | LangGraph Term |
|---------|------------|----------------|
| State | Conversation + agent data | `MessagesState` or custom `State` |
| Nodes | Processing steps | Functions that take state, return state updates |
| Edges | Flow between nodes | Conditional edges for tool routing |
| Checkpoint | Saved state snapshot | `PostgresSaver` / `MemorySaver` |
| Graph | The agent pipeline | `StateGraph` → `.compile()` |

### 3.2 Minimal `StateGraph` for a Conversational Agent

```typescript
// lib/agent/graph.ts
import { StateGraph, MessagesState, ToolNode, START, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { Tool } from '@langchain/core/tools';
import { z } from 'zod';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

// --- 1. Define Tools (LangChain format) ---
const tools = [
  new Tool({
    name: 'get_pet_info',
    description: 'Get detailed information about a pet type',
    schema: z.object({
      petType: z.string().describe('The pet type slug, e.g. "golden-retriever"'),
    }),
    func: async ({ petType }) => {
      // Fetch from Supabase or YAML
      return JSON.stringify({ name: petType, description: '...', budget: '...' });
    },
  }),
  new Tool({
    name: 'update_expense_table',
    description: 'Draft an update to the Estimated Expense Table',
    schema: z.object({
      category: z.string(),
      estimatedCost: z.number(),
      frequency: z.enum(['one-time', 'monthly', 'annual']),
      notes: z.string().optional(),
    }),
    func: async (args) => {
      // This stores a draft, NOT the final save (per PRD: confirmation required)
      return JSON.stringify({ ...args, status: 'draft', draftId: crypto.randomUUID() });
    },
  }),
  new Tool({
    name: 'add_concern',
    description: 'Add a concern to the Concern Checklist',
    schema: z.object({
      title: z.string(),
      severity: z.enum(['minor', 'moderate', 'major']),
      description: z.string(),
    }),
    func: async (args) => {
      return JSON.stringify({ ...args, status: 'draft', draftId: crypto.randomUUID() });
    },
  }),
];

// --- 2. Create tool node ---
const toolNode = new ToolNode(tools);

// --- 3. Create LLM with tools ---
const llm = new ChatOpenAI({
  modelName: 'deepseek/deepseek-chat', // via OpenRouter
  temperature: 0.7,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  },
}).bindTools(tools);

// --- 4. Define agent node ---
async function agentNode(state: MessagesState) {
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

// --- 5. Define routing ---
function shouldContinue(state: MessagesState): 'toolNode' | typeof END {
  const lastMessage = state.messages[state.messages.length - 1];
  // If LLM requested tool calls, route to tool node
  if (lastMessage.tool_calls?.length) {
    return 'toolNode';
  }
  return END;
}

// --- 6. Build and compile graph ---
const workflow = new StateGraph(MessagesState)
  .addNode('agent', agentNode)
  .addNode('toolNode', toolNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('toolNode', 'agent'); // loop back after tool execution

// --- 7. Compile with PostgresSaver ---
export async function createAgent(checkpointer: PostgresSaver) {
  return workflow.compile({ checkpointer });
}

// Convenience: memory-only for dev
export const devAgent = workflow.compile({
  // No checkpointer = no persistence between turns
});
```

### 3.3 How Checkpoints Work

```
Turn 1: User asks "Tell me about Corgis"
  → agentNode (LLM) → toolNode (get_pet_info) → agentNode (LLM responds)
  → checkpoint saved at each step
  
Turn 2: User asks "Can I afford one?"
  → graph resumes from last checkpoint
  → state.messages includes full conversation history
  → LLM has context from turn 1
```

**Config needed per invocation:**
```typescript
const config = {
  configurable: {
    thread_id: 'session-123', // Unique per conversation
  },
};
```

### 3.4 PostgresSaver Setup

```typescript
// lib/agent/checkpointer.ts
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

let checkpointer: PostgresSaver | null = null;

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (checkpointer) return checkpointer;

  checkpointer = PostgresSaver.fromConnString(
    process.env.DATABASE_URL! // Supabase connection string
  );

  await checkpointer.setup(); // Creates checkpoint tables if not exist
  return checkpointer;
}
```

**Required env var:**
```
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

Find this in Supabase Dashboard → Settings → Database → Connection string → URI.

**Tables created by `checkpointer.setup()`:**
- `checkpoints` — main state snapshots
- `checkpoint_blobs` — channel data
- `checkpoint_writes` — pending writes

### 3.5 LangGraph Streaming Modes

LangGraph supports multiple streaming modes:

```typescript
// Token-level streaming (newer versions of langgraph)
for await (const chunk of await graph.stream(input, {
  configurable: { thread_id },
  streamMode: 'messages', // or 'updates', 'values', 'custom'
})) {
  // chunk is an AIMessageChunk or similar
}
```

| Stream Mode | What You Get | Best For |
|-------------|-------------|----------|
| `values` | Full state after each step | Simple state streaming |
| `updates` | State deltas per node | Detecting node transitions |
| `messages` | Individual message chunks | Token-level streaming to UI |

---

## 4. Tool Calling Pattern — Bridging Vercel AI SDK + LangGraph

### 4.1 The Decision: Two Tool Definition Formats

**LangChain/LangGraph tools** — used INSIDE the LangGraph graph:
```typescript
new Tool({ name, description, schema, func })
```

**Vercel AI SDK tools** — used with `streamText`/`generateText`:
```typescript
tool({ description, parameters, execute })
```

### 4.2 Simplest Integration: LangGraph-Dominant

For Lukluk, the simplest approach is **LangGraph-dominant**:

1. **Define tools once** in LangChain format
2. **LangGraph runs the full agent loop** (LLM → tools → LLM)
3. **Stream results to client** using LangGraph's streaming
4. **Client uses a shim** to make the response AI SDK-compatible for `useChat`

### 4.3 Shared Tool Implementation

```typescript
// lib/agent/tools.ts
import { tool as aiTool } from 'ai';  // Vercel AI SDK
import { Tool as LCTool } from '@langchain/core/tools';  // LangChain
import { z } from 'zod';

// --- Shared schema ---
const updateExpenseSchema = z.object({
  category: z.string().describe('Expense category, e.g. food, vet, supplies'),
  estimatedCost: z.number().describe('Estimated cost in THB'),
  frequency: z.enum(['one-time', 'monthly', 'annual']),
  notes: z.string().optional(),
});

// --- LangChain version (for LangGraph) ---
export const updateExpenseLCTool = new LCTool({
  name: 'update_expense_table',
  description: 'Draft an update to the Estimated Expense Table. Changes require user confirmation before saving.',
  schema: updateExpenseSchema,
  func: async (args) => {
    // Store as draft in Supabase `agent_drafts` table (per ADR D3)
    const draft = { ...args, type: 'expense_update', status: 'draft', draftId: crypto.randomUUID() };
    // await supabase.from('agent_drafts').insert(draft);
    return JSON.stringify(draft);
  },
});

// --- AI SDK version (for useChat tool streaming) ---
export const updateExpenseAITool = aiTool({
  description: 'Draft an update to the Estimated Expense Table.',
  parameters: updateExpenseSchema,
  execute: async (args) => {
    // Same implementation
    return { ...args, status: 'draft' };
  },
});
```

### 4.4 Tool-Calling Flow in LangGraph

```
User Message
    │
    ▼
┌──────────┐
│ agentNode │  LLM decides: respond directly OR call tools
└─────┬────┘
      │
      ├── no tool_calls → END (return response to user)
      │
      └── has tool_calls → ┌──────────┐
                            │ toolNode  │  Execute tool, return result
                            └─────┬────┘
                                  │
                                  ▼
                            ┌──────────┐
                            │ agentNode │  LLM processes tool result, may respond or call more tools
                            └─────┬────┘
                                  │
                                  └── loop until no more tool_calls (or maxSteps hit)
```

---

## 5. Streaming to Client — The Bridge

### 5.1 The Problem

- LangGraph's native streaming produces LangChain message chunks
- Vercel AI SDK's `useChat` expects a specific streaming format
- They don't natively talk to each other

### 5.2 Solution A: LangGraph Stream → SSE → useChat Shim (Recommended)

This is the simplest approach that preserves checkpointing:

```typescript
// app/api/agent/route.ts
import { getCheckpointer } from '@/lib/agent/checkpointer';
import { createAgent } from '@/lib/agent/graph';

export async function POST(req: Request) {
  const { messages, threadId } = await req.json();

  const checkpointer = await getCheckpointer();
  const agent = await createAgent(checkpointer);

  const config = {
    configurable: { thread_id: threadId },
  };

  // Transform LangGraph stream into AI SDK-compatible ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // LangGraph stream with message-level events
        const graphStream = await agent.stream(
          { messages },
          { ...config, streamMode: 'updates' }
        );

        let messageId = crypto.randomUUID();

        for await (const chunk of graphStream) {
          // chunk = { agent: { messages: [AIMessage] } } or { toolNode: { messages: [ToolMessage] } }

          for (const [nodeName, update] of Object.entries(chunk)) {
            if (update.messages) {
              for (const msg of update.messages) {
                // Format as AI SDK expects
                const sseData = JSON.stringify({
                  id: messageId,
                  object: 'chat.completion.chunk',
                  choices: [{
                    delta: {
                      role: msg.getType?.() === 'tool' ? 'tool' : 'assistant',
                      content: msg.content ?? '',
                      tool_calls: msg.tool_calls?.map(tc => ({
                        id: tc.id,
                        type: 'function',
                        function: {
                          name: tc.name,
                          arguments: JSON.stringify(tc.args),
                        },
                      })),
                    },
                  }],
                });

                controller.enqueue(`data: ${sseData}\n\n`);

                // Also send tool results
                if (msg.getType?.() === 'tool') {
                  const toolResult = JSON.stringify({
                    id: msg.tool_call_id,
                    object: 'tool.result',
                    result: msg.content,
                  });
                  controller.enqueue(`data: ${toolResult}\n\n`);
                }
              }
            }
          }
        }

        controller.enqueue('data: [DONE]\n\n');
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 5.3 Solution B: Custom Client Hook (Simpler, More Control)

Skip the AI SDK shimming entirely. Write a lightweight custom hook:

```typescript
// hooks/useAgentChat.ts
'use client';
import { useState, useCallback } from 'react';

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: Array<{ name: string; args: any; result?: any }>;
}

export function useAgentChat(threadId: string) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: AgentMessage = { id: crypto.randomUUID(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          threadId,
        }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const toolCalls: AgentMessage['toolCalls'] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'text') {
              assistantContent += parsed.content;
            } else if (parsed.type === 'tool_call') {
              toolCalls.push({ name: parsed.name, args: parsed.args });
            } else if (parsed.type === 'tool_result') {
              const tc = toolCalls.find(t => t.name === parsed.name);
              if (tc) tc.result = parsed.result;
            }
          } catch {}
        }

        // Live update UI as chunks arrive
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: assistantContent, toolCalls }];
          }
          return [...prev, { id: crypto.randomUUID(), role: 'assistant', content: assistantContent, toolCalls }];
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, threadId]);

  return { messages, sendMessage, isLoading };
}
```

### 5.4 Simplified API Route for Custom Hook

```typescript
// app/api/agent/route.ts
export async function POST(req: Request) {
  const { messages, threadId } = await req.json();

  const agent = await createAgent(await getCheckpointer());

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const graphStream = await agent.stream(
          { messages },
          { configurable: { thread_id: threadId }, streamMode: 'updates' }
        );

        for await (const chunk of graphStream) {
          for (const [nodeName, update] of Object.entries(chunk)) {
            if (!update.messages) continue;

            for (const msg of update.messages) {
              if (msg.getType?.() === 'tool') {
                send({ type: 'tool_result', name: msg.name, result: msg.content });
              } else if (msg.content) {
                send({ type: 'text', content: msg.content });
              }

              if (msg.tool_calls?.length) {
                for (const tc of msg.tool_calls) {
                  send({ type: 'tool_call', name: tc.name, args: tc.args });
                }
              }
            }
          }
        }
        send({ type: 'done' });
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 6. Supabase Persistence

### 6.1 PostgresSaver for LangGraph Checkpoints

LangGraph provides `@langchain/langgraph-checkpoint-postgres` which works with any PostgreSQL database, including Supabase.

**Installation:**
```bash
npm install @langchain/langgraph-checkpoint-postgres
```

**Setup (one-time):**
```typescript
// lib/agent/checkpointer.ts
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

let saver: PostgresSaver | null = null;

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (saver) return saver;

  saver = PostgresSaver.fromConnString(
    process.env.DATABASE_URL!
  );

  // Creates tables: checkpoints, checkpoint_blobs, checkpoint_writes
  await saver.setup();
  return saver;
}
```

**Database tables created:**

```sql
-- Auto-created by checkpointer.setup()
-- Equivalent schema:

CREATE TABLE IF NOT EXISTS checkpoints (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  checkpoint_id TEXT NOT NULL,
  parent_checkpoint_id TEXT,
  type TEXT,
  checkpoint JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS checkpoint_blobs (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL,
  version TEXT NOT NULL,
  type TEXT NOT NULL,
  blob BYTEA,
  PRIMARY KEY (thread_id, checkpoint_ns, channel, version)
);

CREATE TABLE IF NOT EXISTS checkpoint_writes (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  checkpoint_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  channel TEXT NOT NULL,
  type TEXT,
  blob BYTEA NOT NULL,
  task_path TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);
```

### 6.2 User Data Tables (Application State)

Separate from LangGraph checkpoints, the Lukluk app needs its own tables:

```sql
-- Planning Pet Profiles
CREATE TABLE planning_pet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  pet_type_id TEXT NOT NULL,          -- References pet YAML slug
  name TEXT DEFAULT 'Future Pet',     -- Default planning name
  decision_status TEXT DEFAULT 'exploring',  -- exploring, considering, ready, not_a_fit, already_have
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent Drafts (per ADR D3: pending user confirmation)
CREATE TABLE agent_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES planning_pet_profiles NOT NULL,
  thread_id TEXT NOT NULL,            -- Links to LangGraph checkpoint thread
  draft_type TEXT NOT NULL,           -- 'expense_update', 'concern_add', 'decision_status_change'
  payload JSONB NOT NULL,             -- The proposed change
  status TEXT DEFAULT 'pending',      -- pending, confirmed, rejected
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Estimated Expense Table
CREATE TABLE estimated_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES planning_pet_profiles NOT NULL,
  category TEXT NOT NULL,             -- food, vet, supplies, grooming, etc.
  estimated_cost_thb NUMERIC NOT NULL,
  frequency TEXT NOT NULL,            -- one-time, monthly, annual
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Concern Checklist
CREATE TABLE concern_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES planning_pet_profiles NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL,             -- minor, moderate, major
  description TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent session threads (maps LangGraph thread_id → user profiles)
CREATE TABLE agent_threads (
  thread_id TEXT PRIMARY KEY,
  profile_id UUID REFERENCES planning_pet_profiles NOT NULL,
  agent_type TEXT NOT NULL,           -- 'decision' | 'care'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);
```

### 6.3 Loading Conversation History

```typescript
// lib/agent/load-conversation.ts
export async function loadConversationHistory(threadId: string) {
  const checkpointer = await getCheckpointer();

  // Get the latest checkpoint for this thread
  const config = { configurable: { thread_id: threadId } };
  const state = await checkpointer.get(config);

  if (!state) {
    return []; // New conversation
  }

  // state.messages contains the full conversation
  return state.messages ?? [];
}

// Resuming a conversation:
export async function resumeAgent(threadId: string, newMessage: string) {
  const agent = await createAgent(await getCheckpointer());
  const history = await loadConversationHistory(threadId);

  const allMessages = [
    ...history,
    { role: 'user', content: newMessage },
  ];

  return agent.stream(
    { messages: allMessages },
    { configurable: { thread_id: threadId }, streamMode: 'updates' }
  );
}
```

---

## 7. Minimal Full-Stack Implementation

### 7.1 File Structure

```
src/
├── app/
│   ├── api/
│   │   └── agent/
│   │       └── route.ts          # POST handler — runs LangGraph, streams back
│   └── workspace/
│       └── [profileId]/
│           └── page.tsx          # Two-panel workspace (left: artifacts, right: chat)
├── components/
│   ├── AgentChat.tsx              # Chat UI using useAgentChat hook
│   ├── DecisionPanel.tsx          # Left panel: expenses, concerns, status
│   └── DraftBanner.tsx            # "Agent drafted changes — confirm?" banner
├── hooks/
│   └── useAgentChat.ts            # Custom streaming hook
├── lib/
│   └── agent/
│       ├── graph.ts               # LangGraph StateGraph definition
│       ├── checkpointer.ts        # PostgresSaver singleton
│       ├── tools.ts               # Tool definitions (LangChain format)
│       └── prompts.ts             # System prompts for Decision Agent / Care Agent
└── supabase/
    └── migrations/
        └── 001_agent_tables.sql   # Application tables (not LangGraph tables)
```

### 7.2 Minimal API Route (30 lines)

```typescript
// app/api/agent/route.ts
import { getCheckpointer } from '@/lib/agent/checkpointer';
import { createAgent } from '@/lib/agent/graph';

export const runtime = 'edge'; // Optional: edge runtime for lower latency
export const maxDuration = 60; // seconds

export async function POST(req: Request) {
  const { messages, threadId } = await req.json();

  const agent = await createAgent(await getCheckpointer());

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const graphStream = await agent.stream(
          { messages },
          { configurable: { thread_id: threadId }, streamMode: 'updates' }
        );

        for await (const chunk of graphStream) {
          for (const [, update] of Object.entries(chunk)) {
            if (!(update as any).messages) continue;
            for (const msg of (update as any).messages) {
              const payload = { type: msg.getType?.() === 'tool' ? 'tool' : 'text', content: msg.content ?? '' };
              if (msg.tool_calls?.length) payload.toolCalls = msg.tool_calls.map(tc => ({ name: tc.name, args: tc.args }));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(e) })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
```

### 7.3 Minimal Graph (40 lines)

```typescript
// lib/agent/graph.ts
import { StateGraph, MessagesState, ToolNode, START, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { DECISION_AGENT_PROMPT } from './prompts';
import { decisionTools } from './tools';

const toolNode = new ToolNode(decisionTools);

const llm = new ChatOpenAI({
  modelName: 'deepseek/deepseek-chat',
  temperature: 0.7,
  configuration: { baseURL: 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY },
}).bindTools(decisionTools);

async function callModel(state: MessagesState) {
  // Prepend system prompt to messages for each invocation
  const systemMsg = { role: 'system', content: DECISION_AGENT_PROMPT };
  const response = await llm.invoke([systemMsg, ...state.messages]);
  return { messages: [response] };
}

function routeAfterLLM(state: MessagesState) {
  const lastMsg = state.messages[state.messages.length - 1];
  return lastMsg.tool_calls?.length ? 'tools' : END;
}

const workflow = new StateGraph(MessagesState)
  .addNode('agent', callModel)
  .addNode('tools', toolNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', routeAfterLLM)
  .addEdge('tools', 'agent');

export async function createAgent(checkpointer: PostgresSaver) {
  return workflow.compile({ checkpointer });
}
```

### 7.4 Minimal System Prompt

```typescript
// lib/agent/prompts.ts
export const DECISION_AGENT_PROMPT = `You are Lukluk's Decision Agent. You help users decide whether a pet type fits their life.

## Your Role
- Ask about the user's work, lifestyle, schedule, budget, and living situation
- Use tools to draft updates to the Estimated Expense Table and Concern Checklist
- Talk about Responsible Fit: budget, time, space, allergies, legality, existing pets, noise, travel
- NEVER encourage a pet the user cannot responsibly care for

## Available Tools
- \`get_pet_info\`: Get facts about a pet type (costs, care, concerns)
- \`update_expense_table\`: Draft an expense entry (requires user confirmation)
- \`add_concern\`: Draft a concern for the checklist (requires user confirmation)

## Important Rules
1. Drafts you create are NOT saved until the user explicitly confirms them
2. Always explain WHY you're suggesting a change — cite specific fit factors
3. Use Owner Experiences as anecdotal evidence only, label them clearly
4. Be concise and conversational. Ask one question at a time.
5. If the user's constraints (budget, space, time) make a pet type unsuitable, say so clearly.
`;
```

### 7.5 Client Component

```typescript
// components/AgentChat.tsx
'use client';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useState } from 'react';

export function AgentChat({ profileId, threadId }: { profileId: string; threadId: string }) {
  const { messages, sendMessage, isLoading } = useAgentChat(threadId);
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}>
            <p className="font-semibold text-sm mb-1">
              {msg.role === 'user' ? 'You' : 'Decision Agent'}
            </p>
            <p className="whitespace-pre-wrap">{msg.content}</p>

            {/* Tool calls visible inline */}
            {msg.toolCalls?.map((tc, i) => (
              <div key={i} className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200 text-sm">
                <span className="font-mono text-yellow-700">🔧 {tc.name}</span>
                {tc.result && (
                  <div className="mt-1 text-gray-600">
                    Result: pending your confirmation
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {isLoading && <div className="text-gray-400 text-sm animate-pulse">Agent is thinking...</div>}
      </div>

      <form
        onSubmit={e => { e.preventDefault(); sendMessage(input); setInput(''); }}
        className="p-4 border-t flex gap-2"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about this pet..."
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Send
        </button>
      </form>
    </div>
  );
}
```

---

## 8. Package Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "@langchain/core": "^0.3.x",
    "@langchain/langgraph": "^0.2.x",
    "@langchain/langgraph-checkpoint-postgres": "^0.1.x",
    "@langchain/openai": "^0.3.x",
    "ai": "^3.x",
    "zod": "^3.x",
    "crypto": "built-in"
  }
}
```

**Key version notes:**
- `@langchain/langgraph@^0.2` — stable StateGraph with checkpointing
- `@langchain/langgraph-checkpoint-postgres@^0.1` — PG checkpoint saver
- `ai@^3` — Vercel AI SDK with `streamText`, `tool()`, `useChat`
- `zod` — shared schema validation for tools (used by both LangChain and AI SDK)

---

## 9. Which Pattern to Choose? (Decision Matrix)

| Approach | Complexity | Checkpointing | Streaming UX | Best For |
|----------|-----------|---------------|--------------|----------|
| **A: LangGraph + custom SSE** | Medium | ✅ Native PostgresSaver | ✅ Custom stream | Full control, checkpointing matters |
| **B: AI SDK streamText only** | Low | ❌ Manual or none | ✅ useChat native | Simple chat, no persistence needed |
| **C: AI SDK + manual PG state** | Medium-High | ⚠️ Manual | ✅ useChat native | When useChat UX is critical |
| **D: LangGraph in Vercel AI SDK** | High | ✅ Via adapter | ✅ useChat native | Future when adapters mature |

### Recommendation for Lukluk v1: **Approach A**

**Reasons:**
1. **Checkpointing is critical** — the Decision Agent must remember conversation context across turns (per ADR D6). PostgresSaver handles this natively.
2. **Custom streaming is sufficient** — the `useAgentChat` hook is ~50 lines, well within v1 scope.
3. **Tool definitions stay simple** — define once in LangChain format, no duplication.
4. **Avoids framework fighting** — LangGraph and AI SDK have different mental models; picking one as primary avoids complexity.
5. **Deploy-friendly** — survives deploys and cold starts via PostgresSaver (per ADR D6).

### If Streaming UX Must Use AI SDK's `useChat`

Then the next-simplest approach is to:
1. Run LangGraph for the agent loop + checkpointing
2. At the end, collect the final messages
3. Feed them through AI SDK's `streamText` for the streaming response
4. This adds latency but gives native useChat support

---

## 10. Gotchas & Pitfalls

### 10.1 PostgresSaver Connection Pooling
Supabase uses PgBouncer in transaction mode. The PostgresSaver uses session-level features. Use the **Session mode** connection string (port 5432) or disable PgBouncer for the agent connections.

**Fix:** In Supabase Dashboard → Database → Connection Pooling, find the "Session mode" connection or use port 6543 with `?pgbouncer=true` only for read queries.

### 10.2 LangGraph State Size
Conversations grow with every turn. The PostgresSaver stores full state in JSONB. For long conversations, implement context compacting (per ADR D11):
```typescript
// Before invoking, trim messages if over token budget
function compactMessages(messages: BaseMessage[], maxTokens: number): BaseMessage[] {
  // Keep system prompt + last N messages, summarize older ones
  // LangChain has built-in summarization helpers
}
```

### 10.3 Cold Starts on Vercel
- PostgresSaver setup is a one-time connection. Cache the instance.
- LangGraph graph compilation is fast (< 50ms). Compile on each request or cache.
- The Edge Runtime may not work with `pg` (the Postgres driver). Use Node.js runtime if needed.

### 10.4 Tool Execution & Confirmation Flow
Per ADR D3: agent drafts go to `agent_drafts` table, require user confirmation. The tool implementations should INSERT into this table, NOT directly modify `estimated_expenses` or `concern_checklist`. A separate API endpoint handles confirmation.

### 10.5 Max Tool-Calling Steps
LangGraph loops: `agent → tools → agent → tools → ...`. Without a max, an LLM could loop forever. Either:
- Bind `maxSteps` to the LLM (if using `streamText` path)
- Add a counter node in LangGraph that forces END after N iterations

---

## 11. Quick Start Checklist

1. **Install packages:**
   ```bash
   npm install @langchain/core @langchain/langgraph @langchain/langgraph-checkpoint-postgres @langchain/openai ai zod
   ```

2. **Set up Supabase connection string:**
   ```
   DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
   ```

3. **Create `lib/agent/checkpointer.ts`** — PostgresSaver singleton

4. **Create `lib/agent/tools.ts`** — Tool definitions (get_pet_info, update_expense_table, add_concern)

5. **Create `lib/agent/prompts.ts`** — Decision Agent system prompt

6. **Create `lib/agent/graph.ts`** — StateGraph with agent + tools nodes

7. **Create `app/api/agent/route.ts`** — POST handler with streaming

8. **Create `hooks/useAgentChat.ts`** — Client streaming hook

9. **Create `components/AgentChat.tsx`** — Chat UI

10. **Run PostgresSaver.setup()** — Creates checkpoint tables
   ```bash
   # Or run at app startup:
   # scripts/setup-checkpointer.ts
   ```

---

## 12. References

- Vercel AI SDK Docs: https://sdk.vercel.ai/docs
- LangGraph Docs: https://langchain-ai.github.io/langgraph/
- LangGraph PostgresSaver: https://langchain-ai.github.io/langgraph/how-tos/persistence_postgres/
- Supabase Connection Pooling: https://supabase.com/docs/guides/database/connecting-to-postgres
- OpenRouter API: https://openrouter.ai/docs
- AI SDK LangChain/LangGraph adapter (experimental): https://sdk.vercel.ai/providers/adapters
