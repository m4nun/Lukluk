import type { DecisionStatus, ConcernStatus } from "./types";

export interface ExpenseItem {
  category: "initial" | "monthly" | "annual" | "one_time" | "food" | "medical" | "grooming" | "supplies" | "other";
  item: string;
  amount_thb: number;
  note?: string | null;
}

export interface ConcernChecklistItem {
  concern_id: string;
  title: string;
  status: ConcernStatus;
  note?: string | null;
}

export type AgentDraftStatus = "pending" | "confirmed" | "rejected" | "stale";

export interface AgentDraft {
  id: string;
  planning_pet_profile_id: string;
  target: "estimated_expenses" | "concern_checklist" | "decision_status" | "actual_expenses" | "activity_schedule" | "food_guide";
  field_path: string | null;
  current_value: unknown;
  proposed_value: unknown;
  status: AgentDraftStatus;
}
