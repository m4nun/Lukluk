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
import { ArrowUp } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
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
        { role: "assistant", text: data.response },
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
    <div className="flex flex-1 flex-col">
      <Conversation className="flex-1">
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

      <div className="border-t px-4 py-3">
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
