"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { ArrowUp, Search, Sparkles, Pencil } from "lucide-react";

interface ProgressEvent {
  type: "searching" | "creating" | "thinking";
  message: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  progress?: ProgressEvent[];
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
  externalInput?: string;
  onExternalInputConsumed?: () => void;
}

function ProgressIndicator({ event }: { event: ProgressEvent }) {
  const icon = event.type === "searching"
    ? <Search className="size-3 text-blue-500" />
    : event.type === "creating"
    ? <Sparkles className="size-3 text-green-500" />
    : <Pencil className="size-3 text-amber-500" />

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
      {icon}
      <span>{event.message}</span>
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
  externalInput,
  onExternalInputConsumed,
}: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const progressRef = useRef<ProgressEvent[]>([]);

  useEffect(() => {
    if (externalInput) {
      setInput(externalInput);
      onExternalInputConsumed?.();
    }
  }, [externalInput, onExternalInputConsumed]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: messageText }]);
    setError("");
    setLoading(true);
    setProgress([]);
    progressRef.current = [];

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: profileId, message: messageText }),
      });

      if (!res.ok) throw new Error("Agent request failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            continue;
          }
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            const eventLine = lines.find(l => l.startsWith("event: "));
            const eventType = eventLine ? eventLine.slice(7) : "unknown";

            if (eventType === "progress") {
              const event = data as ProgressEvent;
              progressRef.current = [...progressRef.current, event];
              setProgress([...progressRef.current]);
            } else if (eventType === "done") {
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  text: data.response,
                  progress: [...progressRef.current],
                },
              ]);
              setProgress([]);
              progressRef.current = [];
              onMessageSent?.();
            } else if (eventType === "error") {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I hit a snag. Can you try again?",
        },
      ]);
      setProgress([]);
      progressRef.current = [];
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
                  {msg.progress && msg.progress.length > 0 && (
                    <div className="mb-2 pl-1 border-l-2 border-border/50 ml-1">
                      {msg.progress.map((event, j) => (
                        <ProgressIndicator key={j} event={event} />
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

          {loading && progress.length > 0 && (
            <Message from="assistant">
              <MessageContent>
                <div className="mb-2 pl-1 border-l-2 border-border/50 ml-1">
                  {progress.map((event, j) => (
                    <ProgressIndicator key={j} event={event} />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Spinner className="size-3" />
                  <span className="text-xs">Generating response...</span>
                </div>
              </MessageContent>
            </Message>
          )}

          {loading && progress.length === 0 && (
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
        <Suggestions className="max-h-9 overflow-hidden">
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
