"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Shared canton for the client topbar flag. The layout seeds it from the
 * client's declaration; any form that carries a canton (declaration, capital,
 * simulation, acomptes) updates it live so the topbar flag tracks what the
 * client is choosing, as the mockup does.
 */
const CantonContext = createContext<{
  canton: string;
  setCanton: (canton: string) => void;
}>({ canton: "", setCanton: () => {} });

export function CantonProvider({
  initial,
  children,
}: {
  initial?: string;
  children: ReactNode;
}) {
  const [canton, setCanton] = useState(initial ?? "");
  return (
    <CantonContext.Provider value={{ canton, setCanton }}>
      {children}
    </CantonContext.Provider>
  );
}

export function useCanton() {
  return useContext(CantonContext);
}
