"use client";

import { useState, useEffect, useCallback } from "react";
import { OnboardingSlide } from "./OnboardingSlide";
import { ChevronRight } from "lucide-react";

const SLIDES = [
  {
    imageSrc: "/assets/PetLogo/golden-retriever/1.png",
    imageAlt: "Golden Gentleman",
    badge: "92% Match",
    badgePosition: "top-right" as const,
    badgeColor: "bg-primary text-white",
    title: "Welcome to Lukluk",
    description:
      "Find your perfect pet companion based on your real lifestyle. No guesswork, just smart matching.",
    colorScheme: "orange" as const,
  },
  {
    imageSrc: "/assets/PetLogo/persian-cat/1.png",
    imageAlt: "Fluffy Persian",
    badge: "RCAS",
    badgePosition: "top-left" as const,
    badgeColor: "bg-purple-500 text-white",
    title: "Take the Fit Quiz",
    description:
      "Answer a few quick questions about your space, budget, and lifestyle. It only takes 2 minutes.",
    colorScheme: "purple" as const,
  },
  {
    imageSrc: "/assets/PetLogo/siamese-cat/1.png",
    imageAlt: "Sassy Siamese",
    badge: "Top Pick",
    badgePosition: "bottom-right" as const,
    badgeColor: "bg-cyan-500 text-white",
    title: "Get Matched",
    description:
      "See your top pet matches with real scores. We compare breed traits to your lifestyle data.",
    colorScheme: "cyan" as const,
  },
  {
    imageSrc: "/assets/PetLogo/welsh-corgi/1.png",
    imageAlt: "Royal Corgi",
    badge: "Ready",
    badgePosition: "bottom-left" as const,
    badgeColor: "bg-emerald-500 text-white",
    title: "Adopt with Confidence",
    description:
      "Know exactly what to expect. Costs, care needs, and compatibility — all before you commit.",
    colorScheme: "green" as const,
  },
];

const TOTAL = SLIDES.length;

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [isClosing, setIsClosing] = useState(false);

  const dismiss = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onComplete();
    }, 350);
  }, [onComplete]);

  const goNext = useCallback(() => {
    if (step < TOTAL) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape") {
        dismiss();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goNext, dismiss]);

  const isLastStep = step === TOTAL;

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-xl transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
    >
      <div
        className={`relative w-full max-w-[380px] overflow-hidden rounded-3xl bg-card shadow-2xl transition-all duration-300 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 px-6 pt-4">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className={`h-[3px] flex-1 max-w-[50px] rounded-full transition-colors duration-300 ${
                i + 1 === step
                  ? "bg-primary"
                  : i + 1 < step
                    ? "bg-primary/40"
                    : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Slides container */}
        <div className="relative h-[400px] overflow-hidden">
          {/* Floating particles */}
          <div className="pointer-events-none absolute inset-0">
            <div className="particle particle-1" />
            <div className="particle particle-2" />
            <div className="particle particle-3" />
            <div className="particle particle-4" />
          </div>

          {/* Slides */}
          {SLIDES.map((slide, i) => {
            const slideNum = i + 1;
            const isActive = slideNum === step;
            const isPast = slideNum < step;

            return (
              <div
                key={slideNum}
                className={`absolute inset-0 flex items-center justify-center px-7 transition-all duration-500 ease-out ${
                  isActive
                    ? "translate-x-0 opacity-100"
                    : isPast
                      ? "-translate-x-full opacity-0"
                      : "translate-x-full opacity-0"
                }`}
              >
                <OnboardingSlide {...slide} />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5">
          <button
            onClick={dismiss}
            className="rounded-full px-3.5 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Skip
          </button>

          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground">
            {step} of {TOTAL}
          </span>

          <button
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5.5 py-3 text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(249,115,22,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] active:scale-[0.97]"
          >
            {isLastStep ? "Get Started" : "Next"}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
