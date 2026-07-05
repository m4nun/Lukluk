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
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
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
  if (h === 0) return `12:${m}am`;
  if (h < 12) return `${h}:${m}am`;
  if (h === 12) return `12:${m}pm`;
  return `${h - 12}:${m}pm`;
}

function activityColor(activity: string): string {
  const lower = activity.toLowerCase();
  if (lower.includes("walk") || lower.includes("exercise") || lower.includes("play") || lower.includes("outdoor"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (lower.includes("feed") || lower.includes("food") || lower.includes("meal") || lower.includes("treat"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (lower.includes("groom") || lower.includes("bath") || lower.includes("brush") || lower.includes("nail"))
    return "bg-purple-50 text-purple-700 border-purple-200";
  if (lower.includes("vet") || lower.includes("medicine") || lower.includes("pill"))
    return "bg-rose-50 text-rose-700 border-rose-200";
  if (lower.includes("sleep") || lower.includes("nap") || lower.includes("rest") || lower.includes("quiet"))
    return "bg-slate-50 text-slate-600 border-slate-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function ActivityCalendar({ schedule, highlight }: ActivityCalendarProps) {
  if (schedule === null) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-8 w-8" />}
        title="No schedule yet"
        description="The Care Agent can help build a daily routine for your pet."
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
      className={`overflow-x-auto rounded-xl border border-border bg-card transition-all duration-500 ${
        highlight ? "ring-2 ring-primary/30 shadow-lg shadow-primary/10" : ""
      }`}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-[72px] bg-muted/80 backdrop-blur border-b border-r border-border px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground">
              Time
            </th>
            {DAY_ORDER.map((day) => (
              <th
                key={day}
                className="border-b border-border bg-muted/80 backdrop-blur px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground min-w-[100px]"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{DAY_SHORT[day]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allTimes.map((time) => (
            <tr key={time} className="group">
              <td className="sticky left-0 z-10 bg-card border-b border-r border-border px-2 py-2 text-xs font-semibold text-primary tabular-nums whitespace-nowrap">
                {formatTime(time)}
              </td>
              {DAY_ORDER.map((day) => {
                const entry = byDay[day].find((a) => a.time === time);
                return (
                  <td
                    key={day}
                    className="border-b border-border px-1.5 py-1.5 text-center align-top min-h-[40px]"
                  >
                    {entry ? (
                      <div
                        className={`rounded-lg border px-2 py-1.5 text-xs font-medium leading-tight ${activityColor(
                          entry.activity,
                        )}`}
                      >
                        {entry.activity}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/30">·</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {allTimes.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No time slots found
        </div>
      )}
    </div>
  );
}
