"use client";

import { useState, useCallback } from "react";
import { HeartIcon, ArrowUp } from "lucide-react";
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

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Track an expense",
  "Build a daily routine",
  "What food should I buy?",
];

export default function CareChat({
  ownedProfileId,
}: {
  ownedProfileId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: messageText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownedProfileId, message: messageText }),
      });

      if (!res.ok) throw new Error("Agent request failed");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.response },
      ]);
    } catch {
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
  }, [input, loading, ownedProfileId]);

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
                  <MessageResponse>{msg.text}</MessageResponse>
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
