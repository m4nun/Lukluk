import type { PetTypeProfile, LifestyleProfileAnswers, MatchResultEntry } from "@/lib/types";
import { defaultDimensions, type ScoreDimension } from "./dimensions";

/**
 * Pure function: scores a list of pet type profiles against a lifestyle.
 * Returns top 3 matches sorted by responsible fit (primary) then MBTI (secondary).
 *
 * @param profiles  - pet type profiles to score (injected by caller)
 * @param lifestyle - user's lifestyle answers
 * @param dimensions - scoring dimensions (defaults to standard set)
 */
export function runMatch(
  profiles: PetTypeProfile[],
  lifestyle: LifestyleProfileAnswers,
  dimensions: ScoreDimension[] = defaultDimensions
): MatchResultEntry[] {
  const scored = profiles.map((profile) => ({
    profile,
    responsibleFit: scoreResponsibleFit(profile, lifestyle, dimensions),
    mbtiFit: scoreMbtiFit(profile, lifestyle),
  }));

  scored.sort((a, b) => {
    if (b.responsibleFit !== a.responsibleFit) return b.responsibleFit - a.responsibleFit;
    return b.mbtiFit - a.mbtiFit;
  });

  return scored.slice(0, 3).map((s, i) => ({
    pet_type_profile_id: s.profile.id,
    rank: i + 1,
    responsible_fit_score: Math.round(s.responsibleFit),
    mbti_match_score: Math.round(s.mbtiFit),
    explanation: generateExplanation(s.profile, lifestyle, s.responsibleFit, dimensions),
  }));
}

function scoreResponsibleFit(
  profile: PetTypeProfile,
  lifestyle: LifestyleProfileAnswers,
  dimensions: ScoreDimension[]
): number {
  let score = 0;
  for (const dim of dimensions) {
    score += dim.score(profile, lifestyle) * dim.weight;
  }
  score *= 100;

  // Hard blockers
  if (profile.restricted_in_thailand) score *= 0.3;
  if (profile.cites_protected) score *= 0.5;

  return Math.min(100, Math.max(0, score));
}

function scoreMbtiFit(profile: PetTypeProfile, lifestyle: LifestyleProfileAnswers): number {
  const scores = [
    profile.child_friendly_score * (lifestyle.child_in_household ? 1.5 : 0.8),
    profile.beginner_match_score * (lifestyle.experience_level === "beginner" ? 1.3 : 1),
    profile.travel_match_score,
    profile.existing_pets_match_score,
  ];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.min(100, avg * 10);
}

function generateExplanation(
  profile: PetTypeProfile,
  lifestyle: LifestyleProfileAnswers,
  fitScore: number,
  dimensions: ScoreDimension[]
): string {
  const parts: string[] = [];

  if (fitScore >= 80) parts.push("Excellent overall fit");
  else if (fitScore >= 60) parts.push("Good fit with some considerations");
  else if (fitScore >= 40) parts.push("Moderate fit — review concerns carefully");
  else parts.push("Several challenges to consider");

  for (const dim of dimensions) {
    if (dim.explain) {
      const note = dim.explain(profile, lifestyle);
      if (note) parts.push(note);
    }
  }

  return parts.join(" · ");
}
