"use client";

import { useState, useEffect, FormEvent } from "react";

interface Experience {
  id: string;
  title: string;
  body: string;
  ownership_duration: string | null;
  created_at: string;
}

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [petTypeId, setPetTypeId] = useState("");
  const [hasOwned, setHasOwned] = useState(true);
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/experiences");
        if (res.ok) {
          const data = await res.json();
          setExperiences(data);
        }
      } catch (err) {
        console.error("Failed to load experiences", err);
      } finally {
        setInitialLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petTypeProfileId: petTypeId,
          title,
          body,
          hasOwned,
          ownershipDuration: duration || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }

      const data = await res.json();
      setExperiences((prev) => [
        { id: data.id, title, body, ownership_duration: duration || null, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setShowForm(false);
      setTitle("");
      setBody("");
      setPetTypeId("");
      setDuration("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Owner Experiences</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Share Your Experience"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 32, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Pet Type</label>
            <input
              value={petTypeId}
              onChange={(e) => setPetTypeId(e.target.value)}
              placeholder="e.g., golden-retriever"
              required
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: 4 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your experience?"
              required
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: 4 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Your Experience</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your story..."
              required
              rows={4}
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: 4 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>How long have you owned?</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 2 years"
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: 4 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={hasOwned} onChange={(e) => setHasOwned(e.target.checked)} />
              I have owned this pet type
            </label>
          </div>
          <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
            {loading ? "Submitting..." : "Share"}
          </button>
          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
        </form>
      )}

      <div style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
        These are anecdotal experiences from self-declared owners — not expert advice.
      </div>

      {initialLoading ? (
        <p>Loading experiences...</p>
      ) : experiences.length === 0 ? (
        <p>No experiences shared yet. Be the first!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {experiences.map((exp) => (
            <div key={exp.id} style={{ padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
              <strong>{exp.title}</strong>
              {exp.ownership_duration && (
                <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>
                  Owned for {exp.ownership_duration}
                </span>
              )}
              <p style={{ marginTop: 8 }}>{exp.body}</p>
              <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
                Shared {new Date(exp.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
