"use client";

import { useEffect, useRef } from "react";
import { useCabinState } from "@/components/scenes/CabinStateContext";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { type Scene, useWorldScene } from "./WorldSceneContext";

const WHEEL_THRESHOLD = 120;
const WHEEL_RESET_MS = 200;
const SWIPE_THRESHOLD = 120;

function resolveSceneTarget(scene: Scene, direction: "up" | "down"): Scene | null {
  if (scene === "cabin") return direction === "up" ? "experience" : "projects";
  if (scene === "experience") return direction === "down" ? "cabin" : null;
  if (scene === "projects") return direction === "up" ? "cabin" : null;
  return null;
}

// Lightweight navigation API: current scene, whether deliberate scene travel
// is currently allowed at all, and a `navigate` function that applies the
// shared gating + side effects (closing the email popover before leaving).
// Safe to call from any component (arrows, menu) -- attaches no listeners.
export function useSceneNavigation() {
  const { cabinState } = useCabinState();
  const { scene, transitionLock, goTo } = useWorldScene();
  const { isBlockingOverlayOpen, menuOpen, closeEmailPopover } = useSiteUI();

  const navAllowed = cabinState === "open" && transitionLock === "idle" && !isBlockingOverlayOpen && !menuOpen;

  function navigate(target: Scene) {
    if (!navAllowed) return;
    if (scene === target) return;
    closeEmailPopover();
    goTo(target);
  }

  return { scene, navAllowed, navigate };
}

// Attaches the window-level wheel/swipe/keyboard listeners that drive
// deliberate scene travel. Mounted exactly once (from WorldSceneController)
// so only a single accumulator/listener set exists regardless of how many
// components want to read navigation state.
export function useSceneGestures() {
  const { scene, navAllowed, navigate } = useSceneNavigation();

  const sceneRef = useRef(scene);
  const navAllowedRef = useRef(navAllowed);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);
  useEffect(() => {
    navAllowedRef.current = navAllowed;
  }, [navAllowed]);
  useEffect(() => {
    navigateRef.current = navigate;
  });

  // Desktop wheel/trackpad: accumulated same-direction delta, not every
  // individual wheel event -- ignores tiny accidental bumps and clearly
  // horizontal-dominant gestures.
  useEffect(() => {
    let accY = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    function reset() {
      accY = 0;
    }

    function handleWheel(event: WheelEvent) {
      if (!navAllowedRef.current) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      event.preventDefault();

      if ((accY > 0 && event.deltaY < 0) || (accY < 0 && event.deltaY > 0)) {
        accY = 0;
      }
      accY += event.deltaY;

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(reset, WHEEL_RESET_MS);

      if (Math.abs(accY) >= WHEEL_THRESHOLD) {
        const direction = accY > 0 ? "down" : "up";
        accY = 0;
        if (resetTimer) clearTimeout(resetTimer);
        const target = resolveSceneTarget(sceneRef.current, direction);
        if (target) navigateRef.current(target);
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, []);

  // Mobile swipe -- plain pointer events, no added dependency. Deliberately
  // high threshold so taps on entry cards never become scene travel.
  useEffect(() => {
    let tracking = false;
    let startX = 0;
    let startY = 0;

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch") return;
      tracking = true;
      startX = event.clientX;
      startY = event.clientY;
    }

    function handlePointerUp(event: PointerEvent) {
      if (!tracking) return;
      tracking = false;
      if (!navAllowedRef.current) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dy) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) return;

      const direction = dy < 0 ? "up" : "down";
      const target = resolveSceneTarget(sceneRef.current, direction);
      if (target) navigateRef.current(target);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  // Keyboard: ArrowUp/ArrowDown only -- Left/Right are reserved for future
  // detail-page carousels and are never touched here.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!navAllowedRef.current) return;
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;

      const direction = event.key === "ArrowUp" ? "up" : "down";
      const next = resolveSceneTarget(sceneRef.current, direction);
      if (next) {
        event.preventDefault();
        navigateRef.current(next);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
