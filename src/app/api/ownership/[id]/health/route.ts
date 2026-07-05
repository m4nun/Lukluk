import { createClient } from "@/lib/supabase/server";
import type { HealthMetric } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("owned_pet_profiles")
    .select("health_metrics")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  if (error || !profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  return Response.json((profile.health_metrics as HealthMetric[]) || []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { metric_type, value, unit, recorded_date, notes } = body;

  if (!metric_type || value === undefined || !unit || !recorded_date) {
    return Response.json({ error: "metric_type, value, unit, and recorded_date are required" }, { status: 400 });
  }

  // Get current metrics
  const { data: profile } = await supabase
    .from("owned_pet_profiles")
    .select("health_metrics")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  const currentMetrics = (profile?.health_metrics as HealthMetric[]) || [];

  const newMetric: HealthMetric = {
    id: crypto.randomUUID(),
    metric_type,
    value,
    unit,
    recorded_date,
    notes: notes || null,
  };

  const updatedMetrics = [...currentMetrics, newMetric];

  const { error } = await supabase
    .from("owned_pet_profiles")
    .update({ health_metrics: updatedMetrics })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, metric: newMetric });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { metric_id } = body;

  if (!metric_id) {
    return Response.json({ error: "metric_id is required" }, { status: 400 });
  }

  // Get current metrics
  const { data: profile } = await supabase
    .from("owned_pet_profiles")
    .select("health_metrics")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  const currentMetrics = (profile?.health_metrics as HealthMetric[]) || [];
  const updatedMetrics = currentMetrics.filter((m) => m.id !== metric_id);

  const { error } = await supabase
    .from("owned_pet_profiles")
    .update({ health_metrics: updatedMetrics })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
