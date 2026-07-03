import { describe, it, expect } from "vitest";
import { transformAnswers, isLifestyleComplete, FIXED_QUESTIONS } from "@/lib/quiz/questions";
import type { LifestyleProfileAnswers } from "@/lib/types";

describe("FIXED_QUESTIONS", () => {
  it("has exactly 9 questions", () => {
    expect(FIXED_QUESTIONS).toHaveLength(9);
  });

  it("covers all 9 lifestyle dimensions", () => {
    const dimensions = new Set(FIXED_QUESTIONS.map((q) => q.dimension));
    expect(dimensions).toContain("budget_tier");
    expect(dimensions).toContain("time_available_hours");
    expect(dimensions).toContain("space_type");
    expect(dimensions).toContain("allergy_level");
    expect(dimensions).toContain("noise_tolerance");
    expect(dimensions).toContain("travel_frequency");
    expect(dimensions).toContain("has_existing_pets");
    expect(dimensions).toContain("experience_level");
    expect(dimensions).toContain("child_in_household");
  });

  it("each question has 3-4 options", () => {
    for (const q of FIXED_QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(4);
    }
  });
});

describe("transformAnswers", () => {
  it("transforms raw key/value to LifestyleProfileAnswers", () => {
    const raw = {
      budget: "medium",
      time: "2",
      space: "apartment",
      allergy: "none",
      noise: "moderate",
      travel: "rare",
      existing_pets: "false",
      experience: "beginner",
      children: "false",
    };
    const result = transformAnswers(raw);
    expect(result.budget_tier).toBe("medium");
    expect(result.time_available_hours).toBe(2);
    expect(result.space_type).toBe("apartment");
    expect(result.allergy_level).toBe("none");
    expect(result.noise_tolerance).toBe("moderate");
    expect(result.travel_frequency).toBe("rare");
    expect(result.has_existing_pets).toBe(false);
    expect(result.experience_level).toBe("beginner");
    expect(result.child_in_household).toBe(false);
  });

  it("parses time as float", () => {
    const result = transformAnswers({ time: "3.5" });
    expect(result.time_available_hours).toBe(3.5);
  });

  it("parses existing_pets as boolean", () => {
    expect(transformAnswers({ existing_pets: "true" }).has_existing_pets).toBe(true);
    expect(transformAnswers({ existing_pets: "false" }).has_existing_pets).toBe(false);
  });

  it("parses children as boolean", () => {
    expect(transformAnswers({ children: "true" }).child_in_household).toBe(true);
    expect(transformAnswers({ children: "false" }).child_in_household).toBe(false);
  });
});

describe("isLifestyleComplete", () => {
  const complete: Partial<LifestyleProfileAnswers> = {
    budget_tier: "medium",
    time_available_hours: 2,
    space_type: "apartment",
    allergy_level: "none",
    noise_tolerance: "moderate",
    travel_frequency: "rare",
    has_existing_pets: false,
    existing_pet_types: [],
    experience_level: "beginner",
    child_in_household: false,
  };

  it("returns true for complete profile", () => {
    expect(isLifestyleComplete(complete)).toBe(true);
  });

  it("returns false if budget_tier is missing", () => {
    const { budget_tier: _, ...incomplete } = complete;
    expect(isLifestyleComplete(incomplete as Partial<LifestyleProfileAnswers>)).toBe(false);
  });

  it("returns false if time_available_hours is undefined", () => {
    expect(isLifestyleComplete({ ...complete, time_available_hours: undefined })).toBe(false);
  });

  it("returns false if has_existing_pets is undefined", () => {
    expect(isLifestyleComplete({ ...complete, has_existing_pets: undefined })).toBe(false);
  });
});
