import type { AgentDraft } from "@/lib/types";

export type CreateDraft = {
  planning_pet_profile_id: string;
  user_id: string;
  target: string;
  current_value: unknown;
  proposed_value: unknown;
};

export interface DraftStore {
  create(draft: CreateDraft): Promise<void>;
  getPending(planningProfileId: string): Promise<AgentDraft[]>;
  confirm(draftId: string): Promise<AgentDraft | null>;
  reject(draftId: string): Promise<void>;
  discardStale(planningProfileId: string, target: string): Promise<void>;
}
