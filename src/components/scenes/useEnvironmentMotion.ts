"use client";

import { useReducedMotion } from "motion/react";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { useWorldScene } from "./WorldSceneContext";

export interface EnvironmentMotion {
  // The visitor asked for reduced motion. Environmental systems answer this
  // by not existing (snow, birds) or by holding still (clouds), rather than
  // by running a second, gentler animation system.
  reducedMotion: boolean;
  // Hold the environment exactly where it is, without hiding it.
  frozen: boolean;
}

// One place to answer "should the cabin's environment be moving right now?",
// derived entirely from state that already exists -- no duplicate overlay or
// visibility flags.
//
// Two reasons to freeze:
//   1. A blocking About/Education panel is open. The world is dimmed behind
//      it, and a dimmed world that keeps snowing reads as an unfinished
//      modal rather than a deliberate one. (The email popover is excluded on
//      purpose: it doesn't dim anything, so freezing the sky behind it would
//      look like a glitch instead of intent. `isBlockingOverlayOpen` already
//      encodes exactly this distinction.)
//   2. The cabin isn't the scene on screen. All three scenes stay mounted
//      and are merely translated out of view, so without this the cabin's
//      particles would keep animating while the visitor is looking at
//      Experience or Projects.
export function useEnvironmentMotion(): EnvironmentMotion {
  const reducedMotion = useReducedMotion() ?? false;
  const { isBlockingOverlayOpen } = useSiteUI();
  const { scene } = useWorldScene();

  return {
    reducedMotion,
    frozen: isBlockingOverlayOpen || scene !== "cabin",
  };
}
