import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { AgentDraft } from "@/lib/types";
import type { DraftStore, CreateDraft } from "./draft-store";

export class SupabaseDraftStore implements DraftStore {
  async create(draft: CreateDraft): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from("agent_drafts").insert({
      planning_pet_profile_id: draft.planning_pet_profile_id,
      user_id: draft.user_id,
      target: draft.target,
      current_value: draft.current_value,
      proposed_value: draft.proposed_value,
      status: "pending",
    });
  }

  async getPending(planningProfileId: string): Promise<AgentDraft[]> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("agent_drafts")
      .select("*")
      .eq("planning_pet_profile_id", planningProfileId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    return (data || []) as AgentDraft[];
  }

  async confirm(draftId: string): Promise<AgentDraft | null> {
    const supabase = getSupabaseAdmin();
    const { data: draft } = await supabase
      .from("agent_drafts")
      .select("*")
      .eq("id", draftId)
      .single();

    if (!draft) return null;

    await supabase.from("agent_drafts").update({ status: "confirmed" }).eq("id", draftId);
    return draft as AgentDraft;
  }

  async reject(draftId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from("agent_drafts").update({ status: "rejected" }).eq("id", draftId);
  }

  async discardStale(planningProfileId: string, target: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("agent_drafts")
      .update({ status: "stale" })
      .eq("planning_pet_profile_id", planningProfileId)
      .eq("target", target)
      .eq("status", "pending");
  }
}
