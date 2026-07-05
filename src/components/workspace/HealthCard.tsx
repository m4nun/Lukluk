"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { EmptyState } from "@/components/layout/EmptyState";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import type { HealthMetric } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, Plus, X } from "lucide-react";

interface HealthCardProps {
  metrics: HealthMetric[] | null;
  onAdd?: (metric: Omit<HealthMetric, "id">) => void;
  onRemove?: (id: string) => void;
}

function getLatestWeight(metrics: HealthMetric[]): HealthMetric | null {
  const weightMetrics = metrics.filter((m) => m.metric_type === "weight");
  if (weightMetrics.length === 0) return null;
  return weightMetrics.sort((a, b) => new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime())[0];
}

function getTrend(metrics: HealthMetric[]): { direction: "up" | "down" | "stable"; value: number } {
  const weightMetrics = metrics
    .filter((m) => m.metric_type === "weight")
    .sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());

  if (weightMetrics.length < 2) return { direction: "stable", value: 0 };

  const latest = weightMetrics[weightMetrics.length - 1].value;
  const previous = weightMetrics[weightMetrics.length - 2].value;
  const diff = latest - previous;

  if (Math.abs(diff) < 0.01) return { direction: "stable", value: 0 };
  return { direction: diff > 0 ? "up" : "down", value: Math.abs(diff) };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HealthCard({ metrics, onAdd, onRemove }: HealthCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newNotes, setNewNotes] = useState("");

  const chartData = useMemo(() => {
    if (!metrics) return [];
    return metrics
      .filter((m) => m.metric_type === "weight")
      .sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime())
      .map((m) => ({
        date: formatDate(m.recorded_date),
        weight: m.value,
        fullDate: formatFullDate(m.recorded_date),
      }));
  }, [metrics]);

  if (metrics == null) {
    return <LoadingSkeleton variant="card" />;
  }

  const weightMetrics = metrics.filter((m) => m.metric_type === "weight");

  if (weightMetrics.length === 0 && !showAddForm) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-6 w-6" />}
        title="No weight data yet"
        description="Track your pet's weight over time. Ask the Care Agent or add manually."
        variant="accent"
        ctaLabel={onAdd ? "Add First Measurement" : undefined}
        onCta={onAdd ? () => setShowAddForm(true) : undefined}
      />
    );
  }

  const latestWeight = getLatestWeight(metrics);
  const trend = getTrend(metrics);

  function handleAdd() {
    if (!newWeight || !newDate) return;
    onAdd?.({
      metric_type: "weight",
      value: parseFloat(newWeight),
      unit: "kg",
      recorded_date: new Date(newDate).toISOString(),
      notes: newNotes || null,
    });
    setNewWeight("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewNotes("");
    setShowAddForm(false);
  }

  return (
    <div className="space-y-4">
      {/* Current Weight Card */}
      {latestWeight && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Weight</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{latestWeight.value}</span>
                <span className="text-sm text-gray-500">{latestWeight.unit}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">{formatFullDate(latestWeight.recorded_date)}</p>
            </div>
            <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
              trend.direction === "up" ? "bg-red-50 text-red-600 border border-red-200" :
              trend.direction === "down" ? "bg-green-50 text-green-600 border border-green-200" :
              "bg-gray-50 text-gray-600 border border-gray-200"
            }`}>
              {trend.direction === "up" && <TrendingUp className="h-4 w-4" />}
              {trend.direction === "down" && <TrendingDown className="h-4 w-4" />}
              {trend.direction === "stable" && <Minus className="h-4 w-4" />}
              {trend.direction !== "stable" && `${trend.value.toFixed(1)} kg`}
              {trend.direction === "stable" && "Stable"}
            </div>
          </div>
        </div>
      )}

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-white p-5">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Weight Trend</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontSize: '13px',
                  }}
                  labelFormatter={(label) => {
                    const item = chartData.find((d) => d.date === label);
                    return item?.fullDate || label;
                  }}
                  formatter={(value) => [`${value} kg`, 'Weight']}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#weightGradient)"
                  dot={{ fill: '#10b981', strokeWidth: 2, stroke: '#fff', r: 5 }}
                  activeDot={{ fill: '#10b981', strokeWidth: 2, stroke: '#fff', r: 7 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weight History */}
      {weightMetrics.length > 0 && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-white p-5">
          <h4 className="text-sm font-bold text-gray-900 mb-3">History</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...weightMetrics]
              .sort((a, b) => new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime())
              .map((metric) => (
                <div key={metric.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{metric.value} {metric.unit}</span>
                    <span className="ml-2 text-xs text-gray-400">{formatFullDate(metric.recorded_date)}</span>
                  </div>
                  {onRemove && (
                    <button
                      onClick={() => onRemove(metric.id)}
                      className="h-6 w-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add Measurement Button */}
      {onAdd && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4 text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">Add Weight Measurement</span>
        </button>
      )}

      {/* Add Measurement Modal */}
      {showAddForm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowAddForm(false)} />
          <div className="fixed inset-x-4 top-[15%] z-50 rounded-2xl bg-white shadow-xl max-w-md mx-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900">Add Weight Measurement</h2>
              <button onClick={() => setShowAddForm(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    placeholder="5.2"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="After vet visit, post-meal, etc."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newWeight || !newDate}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Measurement
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
