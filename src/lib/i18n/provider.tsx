"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { th, type Translations } from "./th";

type Locale = "th" | "en";

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "th",
  t: th,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("th");

  const value = {
    locale,
    t: th, // For now, always use Thai
    setLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
