"use client";

interface ExpenseItem {
  category: string;
  item: string;
  amount_thb: number;
  note?: string;
}

export default function ExpenseTable({ expenses }: { expenses: ExpenseItem[] }) {
  if (expenses.length === 0) {
    return <p>No expense estimates yet. Chat with the Decision Agent to get started.</p>;
  }

  const categories = ["initial", "monthly", "annual", "one_time"];
  const categoryLabels: Record<string, string> = {
    initial: "One-time Setup",
    monthly: "Monthly",
    annual: "Annual",
    one_time: "Other",
  };

  return (
    <div>
      {categories.map((cat) => {
        const items = expenses.filter((e) => e.category === cat);
        if (items.length === 0) return null;
        const total = items.reduce((sum, e) => sum + e.amount_thb, 0);

        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <h4>{categoryLabels[cat] || cat} — {total.toLocaleString()} THB</h4>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 4 }}>Item</th>
                  <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: 4 }}>THB</th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 4 }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e, i) => (
                  <tr key={i}>
                    <td style={{ padding: 4 }}>{e.item}</td>
                    <td style={{ textAlign: "right", padding: 4 }}>{e.amount_thb.toLocaleString()}</td>
                    <td style={{ padding: 4, color: "#666", fontSize: 13 }}>{e.note || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
