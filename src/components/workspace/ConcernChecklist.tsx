"use client";

interface ConcernItem {
  concern_id: string;
  title: string;
  status: string;
  note?: string;
}

const statusColors: Record<string, string> = {
  unresolved: "orange",
  resolved: "green",
  not_applicable: "#999",
};

export default function ConcernChecklist({ concerns }: { concerns: ConcernItem[] }) {
  if (concerns.length === 0) {
    return <p>No concerns logged yet. The Decision Agent can help identify what to watch for.</p>;
  }

  const unresolved = concerns.filter((c) => c.status === "unresolved").length;

  return (
    <div>
      <p style={{ marginBottom: 8 }}>
        {unresolved} of {concerns.length} concerns unresolved
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {concerns.map((c) => (
          <li key={c.concern_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ color: statusColors[c.status] || "#333", fontSize: 18 }}>●</span>
            <span style={{ flex: 1 }}>{c.title}</span>
            <span style={{ color: statusColors[c.status] || "#333", fontSize: 12 }}>
              {c.status}
            </span>
            {c.note && <span style={{ fontSize: 12, color: "#666" }}>{c.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
