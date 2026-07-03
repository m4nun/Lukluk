import type { LifestyleProfileAnswers, BudgetTier, SpaceTier, AllergenLevel } from "@/lib/types";

export interface QuizQuestion {
  id: string;
  question: string;
  dimension: keyof LifestyleProfileAnswers;
  options: QuizOption[];
}

export interface QuizOption {
  value: string;
  label: string;
}

export const FIXED_QUESTIONS: QuizQuestion[] = [
  {
    id: "budget",
    question: "What's your monthly budget for pet care? (food, supplies, routine vet visits)",
    dimension: "budget_tier",
    options: [
      { value: "low" as BudgetTier, label: "Under 1,000 THB/month" },
      { value: "medium" as BudgetTier, label: "1,000 - 3,000 THB/month" },
      { value: "high" as BudgetTier, label: "3,000 - 8,000 THB/month" },
      { value: "very_high" as BudgetTier, label: "8,000+ THB/month" },
    ],
  },
  {
    id: "time",
    question: "How much time can you dedicate to active pet care daily? (exercise, play, training)",
    dimension: "time_available_hours",
    options: [
      { value: "0.5", label: "30 minutes or less" },
      { value: "1.5", label: "About 1-2 hours" },
      { value: "3", label: "3+ hours" },
    ],
  },
  {
    id: "space",
    question: "What's your current living space?",
    dimension: "space_type",
    options: [
      { value: "apartment" as SpaceTier, label: "Apartment/Condo" },
      { value: "house" as SpaceTier, label: "House" },
      { value: "large_house_outdoor" as SpaceTier, label: "Large house with outdoor space" },
    ],
  },
  {
    id: "allergy",
    question: "Do you or anyone in your household have pet allergies?",
    dimension: "allergy_level",
    options: [
      { value: "none" as AllergenLevel, label: "No allergies" },
      { value: "low" as AllergenLevel, label: "Mild allergies" },
      { value: "medium" as AllergenLevel, label: "Moderate allergies" },
      { value: "high" as AllergenLevel, label: "Severe allergies" },
    ],
  },
  {
    id: "noise",
    question: "How much noise can you tolerate from a pet?",
    dimension: "noise_tolerance",
    options: [
      { value: "high", label: "Loud is fine — barking/meowing doesn't bother me" },
      { value: "moderate", label: "Some noise is okay but not constant" },
      { value: "low", label: "I need a quiet pet" },
    ],
  },
  {
    id: "travel",
    question: "How often do you travel away from home?",
    dimension: "travel_frequency",
    options: [
      { value: "rare", label: "Rarely — maybe once or twice a year" },
      { value: "occasional", label: "Occasionally — every couple months" },
      { value: "frequent", label: "Frequently — monthly or more" },
    ],
  },
  {
    id: "existing_pets",
    question: "Do you already have pets at home?",
    dimension: "has_existing_pets",
    options: [
      { value: "false", label: "No, this would be my first pet" },
      { value: "true", label: "Yes, I have other pets" },
    ],
  },
  {
    id: "experience",
    question: "What's your experience level with pets?",
    dimension: "experience_level",
    options: [
      { value: "beginner", label: "Beginner — first time or very little experience" },
      { value: "intermediate", label: "Intermediate — I've had pets before" },
      { value: "experienced", label: "Experienced — I've cared for many pets" },
    ],
  },
  {
    id: "children",
    question: "Are there children in your household?",
    dimension: "child_in_household",
    options: [
      { value: "false", label: "No children" },
      { value: "true", label: "Yes, children live here or visit often" },
    ],
  },
];

export function transformAnswers(raw: Record<string, string>): Partial<LifestyleProfileAnswers> {
  return {
    budget_tier: raw.budget as BudgetTier | undefined,
    time_available_hours: raw.time ? parseFloat(raw.time) : undefined,
    space_type: raw.space as SpaceTier | undefined,
    allergy_level: raw.allergy as AllergenLevel | undefined,
    noise_tolerance: raw.noise as "low" | "moderate" | "high" | undefined,
    travel_frequency: raw.travel as "rare" | "occasional" | "frequent" | undefined,
    has_existing_pets: raw.existing_pets === "true",
    existing_pet_types: [],
    experience_level: raw.experience as "beginner" | "intermediate" | "experienced" | undefined,
    child_in_household: raw.children === "true",
  };
}

export function isLifestyleComplete(answers: Partial<LifestyleProfileAnswers>): answers is LifestyleProfileAnswers {
  return (
    answers.budget_tier != null &&
    answers.time_available_hours != null &&
    answers.space_type != null &&
    answers.allergy_level != null &&
    answers.noise_tolerance != null &&
    answers.travel_frequency != null &&
    answers.has_existing_pets != null &&
    answers.experience_level != null &&
    answers.child_in_household != null
  );
}
