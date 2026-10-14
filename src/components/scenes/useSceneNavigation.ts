"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCabinState } from "@/components/scenes/CabinStateContext";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { PROJECTS_ENABLED } from "@/data/site";
import { type Scene, useWorldScene } from "./WorldSceneContext";

const WHEEL_THRESHOLD = 120;
const WHEEL_RESET_MS = 200;
const SWIPE_THRESHOLD = 120;

// "up" travels toward Experience (it sits above the cabin), "down" toward
// Projects. While Projects is hidden (PROJECTS_ENABLED), nothing travels
// down from the cabin.
function resolveSceneTarget(scene: Scene, direction: "up" | "down"): Scene | null {
  if (scene === "cabin") return direction === "up" ? "experience" : PROJECTS_ENABLED ? "projects" : null;
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
//
// The world only takes gestures while the homepage itself is showing. A detail
// route owns every touch, wheel and key while it's up: the homepage is kept
// alive but hidden behind it, and its listeners are torn down with it, but
// the pathname check makes that independent of how the route cache behaves --
// nothing here can fire from behind a detail page.
export function useSceneGestures() {
  const { scene, navAllowed: sceneNavAllowed, navigate } = useSceneNavigation();
  const onHomepage = usePathname() === "/";
  const navAllowed = sceneNavAllowed && onHomepage;

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

  // Mobile swipe -- plain touch events, no added dependency. Deliberately
  // high threshold so taps on entry cards never become scene travel.
  //
  // Touch events rather than pointer events: once a drag turns into a
  // browser pan, Chrome cancels the pointer (pointercancel) and pointerup
  // never arrives, whereas touchend always does. Passive, so nothing about
  // native touch handling (pinch-zoom included) changes.
  //
  // Natural touch drag: the finger drags the world with it. Dragging DOWN
  // pulls the scene above into view, so from the cabin it travels up to
  // Experience (and from Projects back up to the cabin); dragging UP travels
  // down. That's the opposite sign to the wheel, whose deltaY is a scroll.
  useEffect(() => {
    let tracking = false;
    let startX = 0;
    let startY = 0;

    function handleTouchStart(event: TouchEvent) {
      // A second finger (a pinch) means this isn't a swipe.
      tracking = event.touches.length === 1;
      if (!tracking) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    }

    function handleTouchEnd(event: TouchEvent) {
      if (!tracking) return;
      tracking = false;
      if (!navAllowedRef.current) return;

      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dy) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) return;

      const direction = dy > 0 ? "up" : "down";
      const target = resolveSceneTarget(sceneRef.current, direction);
      if (target) navigateRef.current(target);
    }

    function handleTouchCancel() {
      tracking = false;
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
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
