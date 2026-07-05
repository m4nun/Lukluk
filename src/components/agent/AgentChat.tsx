"use client";

import { useState, useCallback } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Spinner } from "@/components/ui/spinner";
import { ArrowUp, ChevronDown, ChevronRight, Search, Wrench, CheckCircle2 } from "lucide-react";

interface AgentStep {
  type: "thinking" | "tool_call" | "tool_result" | "response";
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  steps?: AgentStep[];
}

interface AgentChatProps {
  endpoint: string;
  bodyKey: string;
  profileId: string;
  suggestions: string[];
  placeholder: string;
  emptyTitle: string;
  emptyDescription: string;
  onMessageSent?: () => void;
}

function StepIcon({ type }: { type: AgentStep["type"] }) {
  switch (type) {
    case "tool_call":
      return <Search className="size-3 text-blue-500" />;
    case "tool_result":
      return <CheckCircle2 className="size-3 text-green-500" />;
    case "thinking":
      return <Wrench className="size-3 text-amber-500" />;
    default:
      return null;
  }
}

function StepItem({ step }: { step: AgentStep }) {
  const [expanded, setExpanded] = useState(false);

  if (step.type === "response") return null;

  const label = step.type === "tool_call"
    ? `Searching: ${step.toolArgs?.query || step.toolName}`
    : step.type === "tool_result"
    ? `Result from ${step.toolName}`
    : step.content.slice(0, 50);

  return (
    <div className="border border-border/50 rounded-lg mb-2 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <StepIcon type={step.type} />
        <span className="flex-1 text-left truncate">{label}</span>
        {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
      {expanded && (
        <div className="px-3 pb-2 text-xs bg-muted/30 border-t border-border/50">
          <pre className="whitespace-pre-wrap font-mono text-[10px] text-muted-foreground mt-2 max-h-40 overflow-y-auto">
            {step.type === "tool_call" && step.toolArgs
              ? JSON.stringify(step.toolArgs, null, 2)
              : step.content}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AgentChat({
  endpoint,
  bodyKey,
  profileId,
  suggestions,
  placeholder,
  emptyTitle,
  emptyDescription,
  onMessageSent,
}: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: messageText }]);
    setError("");
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: profileId, message: messageText }),
      });

      if (!res.ok) throw new Error("Agent request failed");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.response,
          steps: data.steps || [],
        },
      ]);
      onMessageSent?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I hit a snag. Can you try again?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, endpoint, bodyKey, profileId, onMessageSent]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title={emptyTitle}
              description={emptyDescription}
            />
          ) : (
            messages.map((msg, i) => (
              <Message
                key={i}
                from={msg.role === "user" ? "user" : "assistant"}
              >
                <MessageContent>
                  {msg.steps && msg.steps.length > 0 && (
                    <div className="mb-3">
                      {msg.steps.map((step, j) => (
                        <StepItem key={j} step={step} />
                      ))}
                    </div>
                  )}
                  <MessageResponse>
                    {msg.text}
                  </MessageResponse>
                </MessageContent>
              </Message>
            ))
          )}

          {loading && (
            <Message from="assistant">
              <MessageContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Spinner className="size-3" />
                  <span className="text-xs">Thinking...</span>
                </div>
              </MessageContent>
            </Message>
          )}

          {error && (
            <div className="mx-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-destructive text-xs">
              {error}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t px-4 py-3 shrink-0">
        <Suggestions>
          {suggestions.map((s) => (
            <Suggestion
              key={s}
              suggestion={s}
              onClick={() => handleSend(s)}
            />
          ))}
        </Suggestions>

        <div className="mt-3">
          <PromptInput
            onSubmit={() => handleSend()}
            className="rounded-xl border"
          >
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={loading}
                className="min-h-[44px] max-h-[120px]"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputSubmit disabled={loading || !input.trim()}>
                <ArrowUp className="size-4" />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
