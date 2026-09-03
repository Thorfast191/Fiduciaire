"use client";

import { createContext, useContext, type ReactNode } from "react";
import { fr, type Messages } from "./messages/fr";
import { DEFAULT_LOCALE, type Locale } from "./config";

interface I18nValue {
  locale: Locale;
  t: Messages;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  t: fr,
});

/**
 * Carries the resolved bundle to client components. A server component
 * resolves the locale once and hands the bundle down, so no dictionary
 * lookup happens in the browser and the two never disagree across a
 * hydration boundary.
 */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, t: messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** Shorthand for the common case of only needing the strings. */
export function useT(): Messages {
  return useContext(I18nContext).t;
}
