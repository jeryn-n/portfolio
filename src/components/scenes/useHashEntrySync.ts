"use client";

import { useLayoutEffect, useRef } from "react";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { useCabinState } from "./CabinStateContext";
import { sceneFromHash, useWorldScene } from "./WorldSceneContext";

// Runs once, before paint. If the page loaded directly on #experience or
// #projects, the closed-cabin intro is skipped entirely: the cabin is
// treated as already entered/open and we land straight on the requested
// scene with no slide animation. An absent/invalid hash leaves the normal
// closed-cabin flow completely untouched.
export function useHashEntrySync() {
  const ran = useRef(false);
  const { setCabinState } = useCabinState();
  const { markCabinEntered } = useSiteUI();
  const { goTo } = useWorldScene();

  useLayoutEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const target = sceneFromHash(window.location.hash);
    if (!target) return;

    setCabinState("open");
    markCabinEntered();
    goTo(target, { fromHistory: true, instant: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
