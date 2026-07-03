"use client";

const statuses = [
  { value: "exploring", label: "Exploring" },
  { value: "considering", label: "Considering seriously" },
  { value: "ready_to_buy", label: "Ready to buy/adopt" },
  { value: "not_a_fit", label: "Not a fit" },
  { value: "already_have", label: "Already have this pet" },
];

export default function DecisionStatus({
  status,
  onUpdate,
}: {
  status: string;
  onUpdate: (newStatus: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
      <span style={{ fontSize: 13, color: "#666" }}>Status:</span>
      <select value={status} onChange={(e) => onUpdate(e.target.value)} style={{ padding: "4px 8px" }}>
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
