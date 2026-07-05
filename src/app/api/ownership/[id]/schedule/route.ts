import { createClient } from "@/lib/supabase/server";
import type { ScheduleCard } from "@/lib/types";

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
    .select("schedule")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  if (error || !profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  return Response.json((profile.schedule as ScheduleCard[]) || []);
}

export async function PUT(
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
  const { schedules } = body as { schedules: ScheduleCard[] };

  if (!Array.isArray(schedules)) {
    return Response.json({ error: "schedules must be an array" }, { status: 400 });
  }

  const { error } = await supabase
    .from("owned_pet_profiles")
    .update({ schedule: schedules })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
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
  const { title, event_type, date, recurring, recurrence_days, illustration, notes } = body;

  if (!title || !event_type || !date) {
    return Response.json({ error: "title, event_type, and date are required" }, { status: 400 });
  }

  // Get current schedules
  const { data: profile } = await supabase
    .from("owned_pet_profiles")
    .select("schedule")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  const currentSchedules = (profile?.schedule as ScheduleCard[]) || [];

  const newSchedule: ScheduleCard = {
    id: crypto.randomUUID(),
    title,
    event_type,
    date,
    recurring: recurring || false,
    recurrence_days: recurrence_days || null,
    illustration: illustration || null,
    notes: notes || null,
  };

  const updatedSchedules = [...currentSchedules, newSchedule];

  const { error } = await supabase
    .from("owned_pet_profiles")
    .update({ schedule: updatedSchedules })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, schedule: newSchedule });
}

export async function PATCH(
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
  const { schedule_id, completed } = body;

  if (!schedule_id) {
    return Response.json({ error: "schedule_id is required" }, { status: 400 });
  }

  // Get current schedules
  const { data: profile } = await supabase
    .from("owned_pet_profiles")
    .select("schedule")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  const currentSchedules = (profile?.schedule as ScheduleCard[]) || [];
  const scheduleIndex = currentSchedules.findIndex((s) => s.id === schedule_id);

  if (scheduleIndex === -1) {
    return Response.json({ error: "Schedule not found" }, { status: 404 });
  }

  const schedule = currentSchedules[scheduleIndex];
  const updatedSchedules = [...currentSchedules];

  if (completed) {
    // Mark as done
    updatedSchedules[scheduleIndex] = {
      ...schedule,
      completed_date: new Date().toISOString(),
    };

    // If recurring, create next occurrence
    if (schedule.recurring && schedule.recurrence_days) {
      const nextDate = new Date(schedule.date);
      nextDate.setDate(nextDate.getDate() + schedule.recurrence_days);

      const nextSchedule: ScheduleCard = {
        id: crypto.randomUUID(),
        title: schedule.title,
        event_type: schedule.event_type,
        date: nextDate.toISOString(),
        recurring: schedule.recurring,
        recurrence_days: schedule.recurrence_days,
        illustration: schedule.illustration,
        notes: schedule.notes,
      };

      updatedSchedules.push(nextSchedule);
    }
  } else {
    // Update the schedule
    updatedSchedules[scheduleIndex] = {
      ...schedule,
      ...body,
      id: schedule_id, // prevent id override
    };
  }

  const { error } = await supabase
    .from("owned_pet_profiles")
    .update({ schedule: updatedSchedules })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
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
  const { schedule_id } = body;

  if (!schedule_id) {
    return Response.json({ error: "schedule_id is required" }, { status: 400 });
  }

  // Get current schedules
  const { data: profile } = await supabase
    .from("owned_pet_profiles")
    .select("schedule")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  const currentSchedules = (profile?.schedule as ScheduleCard[]) || [];
  const updatedSchedules = currentSchedules.filter((s) => s.id !== schedule_id);

  const { error } = await supabase
    .from("owned_pet_profiles")
    .update({ schedule: updatedSchedules })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
