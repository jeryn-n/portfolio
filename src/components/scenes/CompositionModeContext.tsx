"use client";

import { createContext, useContext } from "react";
import type { CompositionMode } from "@/lib/stage";

const CompositionModeContext = createContext<CompositionMode>("desktop");

export const CompositionModeProvider = CompositionModeContext.Provider;

// Lets any scene component look up the active composition mode without
// prop-drilling it through every layer between SceneStage and the leaf.
export function useCompositionMode(): CompositionMode {
  return useContext(CompositionModeContext);
}
