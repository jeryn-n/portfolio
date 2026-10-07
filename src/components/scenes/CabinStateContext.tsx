"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

export type CabinState = "closed" | "opening" | "open";

interface CabinStateContextValue {
  cabinState: CabinState;
  setCabinState: Dispatch<SetStateAction<CabinState>>;
}

const CabinStateContext = createContext<CabinStateContextValue | null>(null);

// Lifted above SceneStage so both the scaled stage content (CabinScene) and
// the viewport-fixed nav arrows (rendered as its sibling, outside the
// stage's scale transform) can share one closed/opening/open state without
// prop-drilling across that boundary.
export function CabinStateProvider({ children }: { children: ReactNode }) {
  const [cabinState, setCabinState] = useState<CabinState>("closed");
  return <CabinStateContext.Provider value={{ cabinState, setCabinState }}>{children}</CabinStateContext.Provider>;
}

export function useCabinState(): CabinStateContextValue {
  const ctx = useContext(CabinStateContext);
  if (!ctx) {
    throw new Error("useCabinState must be used within a CabinStateProvider");
  }
  return ctx;
}
