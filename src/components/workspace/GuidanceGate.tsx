"use client";

export default function GuidanceGate({
  hasSeenExpenses,
  hasSeenConcerns,
}: {
  hasSeenExpenses: boolean;
  hasSeenConcerns: boolean;
}) {
  const isUnlocked = hasSeenExpenses && hasSeenConcerns;

  if (!isUnlocked) {
    return (
      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8, background: "#f9f9f9" }}>
        <h4>Buying or Adoption Guidance</h4>
        <p style={{ color: "#999" }}>
          Complete your expense estimates and review your concern checklist to unlock personalized adoption guidance.
        </p>
        {!hasSeenExpenses && <p style={{ color: "#999" }}>◯ Review estimated expenses</p>}
        {!hasSeenConcerns && <p style={{ color: "#999" }}>◯ Review concern checklist</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h4>Buying or Adoption Guidance</h4>
      <p>
        You've reviewed the costs and potential concerns for this pet type.
        Chat with the Decision Agent to get personalized guidance on responsible ways to bring this pet home.
      </p>
      <ul style={{ fontSize: 14, color: "#333" }}>
        <li>Research reputable breeders or adoption centers</li>
        <li>Ask about health certifications and guarantees</li>
        <li>Visit in person before committing</li>
        <li>Prepare your home before your pet arrives</li>
      </ul>
    </div>
  );
}
