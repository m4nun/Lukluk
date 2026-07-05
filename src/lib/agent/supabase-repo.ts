import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { PlanningRepository, PlanningProfileWithPetType, OwnedProfile, OwnerExperienceRow } from "./repository";
import type { ExpenseItem, ConcernChecklistItem, DecisionStatus, FoodCard, ScheduleCard, HealthMetric } from "@/lib/types";

export class SupabasePlanningRepository implements PlanningRepository {
  async getProfile(id: string): Promise<PlanningProfileWithPetType | null> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("planning_pet_profiles")
      .select("*, pet_type_profiles!inner(*)")
      .eq("id", id)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      user_id: data.user_id,
      planning_name: data.planning_name,
      decision_status: data.decision_status,
      pet_type: data.pet_type_profiles,
    };
  }

  async getExpenses(planningProfileId: string): Promise<ExpenseItem[]> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("estimated_expenses")
      .select("category, item, amount_thb, note")
      .eq("planning_pet_profile_id", planningProfileId)
      .order("sort_order");

    return (data || []) as ExpenseItem[];
  }

  async getConcerns(planningProfileId: string): Promise<ConcernChecklistItem[]> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("concern_checklist_items")
      .select("concern_id, title, status, note")
      .eq("planning_pet_profile_id", planningProfileId)
      .order("sort_order");

    return (data || []) as ConcernChecklistItem[];
  }

  async getOwnerExperiences(petTypeProfileId: string): Promise<OwnerExperienceRow[]> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("owner_experiences")
      .select("title, body, ownership_duration, created_at")
      .eq("pet_type_profile_id", petTypeProfileId)
      .eq("is_flagged", false)
      .limit(5)
      .order("created_at", { ascending: false });

    return (data || []) as OwnerExperienceRow[];
  }

  async replaceExpenses(planningProfileId: string, expenses: ExpenseItem[]): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase.from("estimated_expenses").delete().eq("planning_pet_profile_id", planningProfileId);

    if (expenses.length > 0) {
      const rows = expenses.map((e, i) => ({
        planning_pet_profile_id: planningProfileId,
        category: e.category,
        item: e.item,
        amount_thb: e.amount_thb,
        note: e.note || null,
        sort_order: i,
      }));
      const { error } = await supabase.from("estimated_expenses").insert(rows);
      if (error) throw new Error(`replaceExpenses: ${error.message}`);
    }

    const { error } = await supabase
      .from("planning_pet_profiles")
      .update({ estimated_expenses: expenses })
      .eq("id", planningProfileId);

    if (error) throw new Error(`replaceExpenses sync: ${error.message}`);
  }

  async replaceConcerns(planningProfileId: string, concerns: ConcernChecklistItem[]): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase.from("concern_checklist_items").delete().eq("planning_pet_profile_id", planningProfileId);

    if (concerns.length > 0) {
      const rows = concerns.map((c, i) => ({
        planning_pet_profile_id: planningProfileId,
        concern_id: c.concern_id,
        title: c.title,
        status: c.status,
        note: c.note || null,
        sort_order: i,
      }));
      const { error } = await supabase.from("concern_checklist_items").insert(rows);
      if (error) throw new Error(`replaceConcerns: ${error.message}`);
    }

    const { error } = await supabase
      .from("planning_pet_profiles")
      .update({ concern_checklist: concerns })
      .eq("id", planningProfileId);

    if (error) throw new Error(`replaceConcerns sync: ${error.message}`);
  }

  async updateDecisionStatus(planningProfileId: string, status: DecisionStatus): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("planning_pet_profiles")
      .update({ decision_status: status })
      .eq("id", planningProfileId);

    if (error) throw new Error(`updateDecisionStatus: ${error.message}`);
  }

  // ---- Care Agent methods ----

  async getOwnedProfile(ownedProfileId: string): Promise<OwnedProfile | null> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("owned_pet_profiles")
      .select("*, pet_type_profiles!inner(*)")
      .eq("id", ownedProfileId)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      pet_name: data.pet_name,
      age_life_stage: data.age_life_stage,
      got_date: data.got_date,
      pet_type: data.pet_type_profiles,
    };
  }

  async getActualExpenses(ownedProfileId: string): Promise<ExpenseItem[]> {
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("owned_pet_profiles")
      .select("actual_expenses")
      .eq("id", ownedProfileId)
      .single();

    return (profile?.actual_expenses || []) as ExpenseItem[];
  }

  async getFoodGuide(ownedProfileId: string): Promise<FoodCard[]> {
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("owned_pet_profiles")
      .select("food_guide")
      .eq("id", ownedProfileId)
      .single();

    return (profile?.food_guide || []) as FoodCard[];
  }

  async replaceActualExpenses(ownedProfileId: string, expenses: ExpenseItem[]): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("owned_pet_profiles")
      .update({ actual_expenses: expenses })
      .eq("id", ownedProfileId);

    if (error) throw new Error(`replaceActualExpenses: ${error.message}`);
  }

  async replaceFoodGuide(ownedProfileId: string, cards: FoodCard[]): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("owned_pet_profiles")
      .update({ food_guide: cards })
      .eq("id", ownedProfileId);

    if (error) throw new Error(`replaceFoodGuide: ${error.message}`);
  }

  async getSchedule(ownedProfileId: string): Promise<ScheduleCard[]> {
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("owned_pet_profiles")
      .select("schedule")
      .eq("id", ownedProfileId)
      .single();

    return (profile?.schedule || []) as ScheduleCard[];
  }

  async getHealthMetrics(ownedProfileId: string): Promise<HealthMetric[]> {
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("owned_pet_profiles")
      .select("health_metrics")
      .eq("id", ownedProfileId)
      .single();

    return (profile?.health_metrics || []) as HealthMetric[];
  }

  async replaceSchedule(ownedProfileId: string, schedule: ScheduleCard[]): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("owned_pet_profiles")
      .update({ schedule })
      .eq("id", ownedProfileId);

    if (error) throw new Error(`replaceSchedule: ${error.message}`);
  }

  async addHealthMetric(ownedProfileId: string, metric: HealthMetric): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("owned_pet_profiles")
      .select("health_metrics")
      .eq("id", ownedProfileId)
      .single();

    const existing = (profile?.health_metrics || []) as HealthMetric[];
    const updated = [...existing, metric];

    const { error } = await supabase
      .from("owned_pet_profiles")
      .update({ health_metrics: updated })
      .eq("id", ownedProfileId);

    if (error) throw new Error(`addHealthMetric: ${error.message}`);
  }

  async deleteHealthMetric(ownedProfileId: string, metricId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("owned_pet_profiles")
      .select("health_metrics")
      .eq("id", ownedProfileId)
      .single();

    const existing = (profile?.health_metrics || []) as HealthMetric[];
    const updated = existing.filter(m => m.id !== metricId);

    const { error } = await supabase
      .from("owned_pet_profiles")
      .update({ health_metrics: updated })
      .eq("id", ownedProfileId);

    if (error) throw new Error(`deleteHealthMetric: ${error.message}`);
  }
}
