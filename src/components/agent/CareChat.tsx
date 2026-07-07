"use client";

import { useState, useCallback, useRef } from "react";
import { HeartIcon, ArrowUp, Search, Sparkles, Pencil } from "lucide-react";
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
import ChatMap from "./ChatMapLoader";
import type { ToolResultRender } from "@/lib/agent/tool-results";
import type { ChatMessage } from "./AgentChat";

interface ProgressEvent {
  type: "searching" | "creating" | "thinking";
  message: string;
}

const SUGGESTIONS = [
  "Track an expense",
  "Build a daily routine",
  "What food should I buy?",
];

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

export default function CareChat({
  ownedProfileId,
}: {
  ownedProfileId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  const updateMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    const newMessages = typeof updater === "function" ? updater(messagesRef.current) : updater;
    messagesRef.current = newMessages;
    setMessages(newMessages);
  }, []);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const progressRef = useRef<ProgressEvent[]>([]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput("");
    updateMessages((prev) => [...prev, { role: "user", text: messageText }]);
    setError("");
    setLoading(true);
    setProgress([]);
    progressRef.current = [];

    try {
      const res = await fetch("/api/agent/care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownedProfileId, message: messageText }),
      });

      if (!res.ok) throw new Error("Agent request failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEventType = "unknown";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7);
            continue;
          }
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (currentEventType === "progress") {
              const event = data as ProgressEvent;
              progressRef.current = [...progressRef.current, event];
              setProgress([...progressRef.current]);
            } else if (currentEventType === "done") {
              updateMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  text: data.response,
                  progress: [...progressRef.current],
                  toolResults: Array.isArray(data.toolResults) ? data.toolResults : [],
                },
              ]);
              setProgress([]);
              progressRef.current = [];
            } else if (currentEventType === "error") {
              throw new Error(data.error);
            }
            currentEventType = "unknown";
          }
        }
      }

      if (buffer.trim()) {
        if (buffer.startsWith("data: ")) {
          const data = JSON.parse(buffer.slice(6));
          if (currentEventType === "done") {
            updateMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                text: data.response,
                progress: [...progressRef.current],
                toolResults: Array.isArray(data.toolResults) ? data.toolResults : [],
              },
            ]);
            setProgress([]);
            progressRef.current = [];
          } else if (currentEventType === "error") {
            throw new Error(data.error);
          }
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Sorry, I hit a snag. Can you try again?";
      setError(errorMessage);
      updateMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: errorMessage,
        },
      ]);
      setProgress([]);
      progressRef.current = [];
    } finally {
      setLoading(false);
    }
  }, [input, loading, ownedProfileId, updateMessages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <HeartIcon className="size-4 text-muted-foreground" />
        <span className="font-semibold text-sm">Care Agent</span>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Hi! I'm your Care Agent"
              description="Ask me about feeding, activity routines, tracking expenses, or any care concerns."
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
                  <MessageResponse>{msg.text}</MessageResponse>
                  {msg.toolResults?.map((tr, k) => {
                    if (tr.renderType === "map") {
                      return (
                        <ChatMap
                          key={`map-${k}`}
                          places={tr.data.places}
                          center={tr.data.center}
                          zoom={tr.data.zoom}
                        />
                      );
                    }
                    return null;
                  })}
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
                  <span className="text-xs">Generating...</span>
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
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t px-4 py-3">
        <Suggestions>
          {SUGGESTIONS.map((s) => (
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
                placeholder="Ask about feeding, schedules, expenses..."
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
