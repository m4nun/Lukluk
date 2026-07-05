"use client";

import { EmptyState } from "@/components/layout/EmptyState";
import { Calendar } from "lucide-react";

interface ActivityEntry {
  day: string;
  activity: string;
  time: string;
}

interface ActivityCalendarProps {
  schedule: ActivityEntry[] | null;
  highlight?: boolean;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

function timeToMinutes(time: string): number {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 999;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function formatTime(time: string): string {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return time;
  const h = parseInt(match[1]);
  const m = match[2];
  if (h === 0) return `12:${m}a`;
  if (h < 12) return `${h}:${m}a`;
  if (h === 12) return `12:${m}p`;
  return `${h - 12}:${m}p`;
}

function activityColor(activity: string): string {
  const lower = activity.toLowerCase();
  if (lower.includes("walk") || lower.includes("exercise") || lower.includes("play") || lower.includes("outdoor"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  if (lower.includes("feed") || lower.includes("food") || lower.includes("meal") || lower.includes("treat"))
    return "bg-amber-50 text-amber-700 border-amber-200/60";
  if (lower.includes("groom") || lower.includes("bath") || lower.includes("brush") || lower.includes("nail"))
    return "bg-purple-50 text-purple-700 border-purple-200/60";
  if (lower.includes("vet") || lower.includes("medicine") || lower.includes("pill"))
    return "bg-rose-50 text-rose-700 border-rose-200/60";
  if (lower.includes("sleep") || lower.includes("nap") || lower.includes("rest") || lower.includes("quiet"))
    return "bg-slate-50 text-slate-600 border-slate-200/60";
  return "bg-blue-50 text-blue-700 border-blue-200/60";
}

export default function ActivityCalendar({ schedule, highlight }: ActivityCalendarProps) {
  if (schedule === null) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-6 w-6" />}
        title="No schedule yet"
        description="The Care Agent can help build a daily routine."
        variant="accent"
      />
    );
  }

  const byDay: Record<string, ActivityEntry[]> = {};
  for (const day of DAY_ORDER) {
    byDay[day] = schedule
      .filter((a) => a.day === day)
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }

  const allTimes = Array.from(
    new Set(schedule.map((a) => a.time).sort((a, b) => timeToMinutes(a) - timeToMinutes(b)))
  );

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-border bg-card transition-all duration-500 ${
        highlight ? "ring-2 ring-primary/30 shadow-lg shadow-primary/10" : ""
      }`}
    >
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-[52px] bg-muted/80 backdrop-blur border-b border-r border-border px-1.5 py-1.5 text-left font-semibold text-muted-foreground" />
            {DAY_ORDER.map((day) => (
              <th
                key={day}
                className="border-b border-border bg-muted/80 backdrop-blur px-1 py-1.5 text-center font-semibold text-muted-foreground min-w-[80px]"
              >
                <span className="hidden sm:inline">{day.slice(0, 3)}</span>
                <span className="sm:hidden">{DAY_SHORT[day]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allTimes.map((time) => (
            <tr key={time} className="group">
              <td className="sticky left-0 z-10 bg-card border-b border-r border-border px-1.5 py-1 font-medium text-primary tabular-nums whitespace-nowrap">
                {formatTime(time)}
              </td>
              {DAY_ORDER.map((day) => {
                const entry = byDay[day].find((a) => a.time === time);
                return (
                  <td
                    key={day}
                    className="border-b border-border px-0.5 py-0.5 text-center align-top min-h-[32px]"
                  >
                    {entry ? (
                      <div
                        className={`rounded border px-1 py-0.5 text-[11px] font-medium leading-tight ${activityColor(
                          entry.activity,
                        )}`}
                      >
                        {entry.activity}
                      </div>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
