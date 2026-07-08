export interface ActivityCard {
  id: string;
  name: string;
  icon: string;
  image?: string | null;
  difficulty: "easy" | "medium" | "hard";
  duration: string;
  frequency: string;
  notes?: string | null;
}

export type ActivityInterest = ActivityCard;

export interface FoodCard {
  id: string;
  name: string;
  brand: string;
  amount: string;
  frequency: string;
  image?: string | null;
  notes?: string | null;
}

export type ScheduleEventType = "vaccine" | "checkup" | "grooming" | "medication" | "boarding" | "emergency" | "other";
export type ScheduleStatus = "upcoming" | "done" | "overdue";

export interface ScheduleCard {
  id: string;
  title: string;
  event_type: ScheduleEventType;
  date: string;
  completed_date?: string | null;
  recurring?: boolean;
  recurrence_days?: number | null;
  illustration?: string | null;
  notes?: string | null;
}

export type HealthMetricType = "weight";

export interface HealthMetric {
  id: string;
  metric_type: HealthMetricType;
  value: number;
  unit: string;
  recorded_date: string;
  notes?: string | null;
}
