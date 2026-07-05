"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

interface Experience {
  id: string;
  title: string;
  body: string;
  ownership_duration: string | null;
  created_at: string;
  profiles?: { display_name: string | null };
}

interface PetExperiencesProps {
  petTypeProfileId: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function PetExperiences({ petTypeProfileId }: PetExperiencesProps) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/experiences?petTypeProfileId=${petTypeProfileId}`);
        if (res.ok) {
          const data = await res.json();
          setExperiences(data.slice(0, 5));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [petTypeProfileId]);

  if (loading || experiences.length === 0) return null;

  return (
    <section className="mt-7" aria-labelledby="experiences-title">
      <h2 id="experiences-title" className="mb-3 flex items-center gap-1.5 text-[15px] font-bold" style={{ fontFamily: "var(--font-display)" }}>
        <MessageSquare className="h-[18px] w-[18px] text-purple-500" />
        Owner Experiences
      </h2>
      <div className="space-y-3">
        {experiences.map((exp) => (
          <div key={exp.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-[11px] font-bold text-purple-600">
                {exp.profiles?.display_name?.[0] || "?"}
              </div>
              <span className="text-[13px] font-semibold text-gray-900">
                {exp.profiles?.display_name || "Anonymous"}
              </span>
              {exp.ownership_duration && (
                <span className="text-[11px] text-gray-400">· {exp.ownership_duration}</span>
              )}
              <span className="ml-auto text-[11px] text-gray-400">{timeAgo(exp.created_at)}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{exp.title}</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-3">{exp.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
