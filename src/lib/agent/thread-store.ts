import type { BaseMessage } from "@langchain/core/messages";
import { createClient } from "@/lib/supabase/server";
import { serializeMessages, deserializeMessages } from "./invoke";

export interface ThreadRow {
  thread_id: string;
  messages: unknown[];
}

export interface ThreadStore {
  /** Find or create a thread for a profile + agent type combination. */
  findOrCreate(params: {
    profileId: string;
    threadField: string;
    agentType: "decision" | "care";
  }): Promise<ThreadRow>;

  /** Persist messages into a thread (keeps last 20 to avoid bloat). */
  save(threadId: string, messages: BaseMessage[]): Promise<void>;
}

/**
 * Production adapter — reads/writes agent_threads in Supabase.
 */
export function createSupabaseThreadStore(): ThreadStore {
  return {
    async findOrCreate({ profileId, threadField, agentType }) {
      const supabase = await createClient();

      let { data: thread } = await supabase
        .from("agent_threads")
        .select("thread_id, messages")
        .eq(threadField, profileId)
        .eq("agent_type", agentType)
        .single();

      if (thread) return thread as ThreadRow;

      const threadId = crypto.randomUUID();
      const insert: Record<string, unknown> = {
        thread_id: threadId,
        agent_type: agentType,
      };
      insert[threadField] = profileId;
      if (threadField === "planning_pet_profile_id") {
        insert.owned_pet_profile_id = null;
      } else {
        insert.planning_pet_profile_id = null;
      }

      const { data: newThread, error } = await supabase
        .from("agent_threads")
        .insert(insert)
        .select("thread_id, messages")
        .single();

      if (error || !newThread) {
        throw new Error(`Failed to create agent thread: ${error?.message || "unknown"}`);
      }

      return newThread as ThreadRow;
    },

    async save(threadId, messages) {
      const supabase = await createClient();
      const messagesToSave = messages.slice(-20);
      await supabase
        .from("agent_threads")
        .update({ messages: serializeMessages(messagesToSave) })
        .eq("thread_id", threadId);
    },
  };
}
