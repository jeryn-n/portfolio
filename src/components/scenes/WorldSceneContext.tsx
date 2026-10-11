"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { SCENE_TRAVEL_DURATION } from "@/lib/sceneTravel";

export type Scene = "experience" | "cabin" | "projects";
export type TransitionLock = "idle" | "transitioning";
export type TravelDirection = "up" | "down" | null;
type Neighbor = "experience" | "projects" | null;

interface GoToOptions {
  // Came from a popstate (Back/Forward) -- don't push another history entry,
  // and allow it even if it looks like a non-adjacent jump.
  fromHistory?: boolean;
  // Snap directly to the target with no slide animation and no transition
  // lock. Used for direct addressing rather than world travel -- the initial
  // #experience/#projects hash entry, and route changes that land on a
  // specific scene (a detail page's Exit control, or the menu on a detail
  // route). Adjacency doesn't apply to these: it constrains animated travel
  // through the cabin hub, not naming a destination outright.
  instant?: boolean;
  // With `instant`: still push a history entry, as animated travel does --
  // for an instant jump made on the homepage itself (the menu crossing
  // Experience<->Projects), where no route change records it.
  recordHistory?: boolean;
}

interface WorldSceneContextValue {
  scene: Scene;
  transitionLock: TransitionLock;
  travelDirection: TravelDirection;
  // Which non-cabin scene the current/last transition involved, used to pick
  // the sky- vs earth-toned gap background visible briefly mid-transition.
  neighborInvolved: Neighbor;
  // True only for the single render that just snapped scenes instantly
  // (hash entry) -- lets the controller skip the slide animation that one time.
  lastMoveInstant: boolean;
  goTo: (target: Scene, options?: GoToOptions) => void;
}

const WorldSceneCtx = createContext<WorldSceneContextValue | null>(null);

export function sceneFromHash(hash: string): Scene | null {
  const value = hash.replace(/^#/, "");
  return value === "experience" || value === "projects" ? value : null;
}

// Cabin is the hub: only Cabin<->Experience and Cabin<->Projects are valid
// single-gesture moves. Experience<->Projects is never a direct move.
function isAdjacentMove(from: Scene, to: Scene): boolean {
  if (from === to) return false;
  return from === "cabin" || to === "cabin";
}

function directionFor(from: Scene, to: Scene): TravelDirection {
  if (from === "experience" || to === "experience") return from === "experience" ? "down" : "up";
  if (from === "projects" || to === "projects") return from === "projects" ? "up" : "down";
  return null;
}

function pushSceneHistory(target: Scene) {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  const url = target === "cabin" ? `${pathname}${search}` : `${pathname}${search}#${target}`;
  window.history.pushState({ scene: target }, "", url);
}

// Central Experience/Cabin/Projects scene state: current scene, the
// transition lock, and a small amount of metadata (travel direction,
// involved neighbor, "was this an instant jump") the controller/UI need to
// render the slide + gap correctly. Scene travel SFX is requested from here
// (not from each caller) since every path -- arrows, menu, gestures, history
// -- funnels through goTo.
export function WorldSceneProvider({ children }: { children: ReactNode }) {
  const [scene, setScene] = useState<Scene>("cabin");
  const [transitionLock, setTransitionLock] = useState<TransitionLock>("idle");
  const [travelDirection, setTravelDirection] = useState<TravelDirection>(null);
  const [neighborInvolved, setNeighborInvolved] = useState<Neighbor>(null);
  const [lastMoveInstant, setLastMoveInstant] = useState(false);
  const { playSfx } = useAudio();

  const sceneRef = useRef(scene);
  const lockRef = useRef(transitionLock);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);
  useEffect(() => {
    lockRef.current = transitionLock;
  }, [transitionLock]);

  const goTo = useCallback(
    (target: Scene, options: GoToOptions = {}) => {
      const current = sceneRef.current;
      if (current === target) return;
      if (!options.fromHistory && !options.instant && !isAdjacentMove(current, target)) return;
      if (!options.instant && lockRef.current === "transitioning") return;

      setTravelDirection(directionFor(current, target));
      setNeighborInvolved(current === "cabin" ? (target as Neighbor) : (current as Neighbor));
      setLastMoveInstant(Boolean(options.instant));
      setScene(target);
      sceneRef.current = target;

      if (options.instant) {
        if (options.recordHistory && !options.fromHistory) pushSceneHistory(target);
        return;
      }

      playSfx("swipe");

      setTransitionLock("transitioning");
      lockRef.current = "transitioning";
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(() => {
        setTransitionLock("idle");
        lockRef.current = "idle";
      }, SCENE_TRAVEL_DURATION * 1000);

      if (!options.fromHistory) {
        pushSceneHistory(target);
      }
    },
    [playSfx],
  );

  useEffect(() => {
    function handlePopState() {
      const target = sceneFromHash(window.location.hash) ?? "cabin";
      // Back/Forward across an instant Experience<->Projects jump is instant
      // too, rather than travelling all the way through the cabin.
      goTo(target, { fromHistory: true, instant: !isAdjacentMove(sceneRef.current, target) });
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [goTo]);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, []);

  const value: WorldSceneContextValue = {
    scene,
    transitionLock,
    travelDirection,
    neighborInvolved,
    lastMoveInstant,
    goTo,
  };

  return <WorldSceneCtx.Provider value={value}>{children}</WorldSceneCtx.Provider>;
}

export function useWorldScene(): WorldSceneContextValue {
  const ctx = useContext(WorldSceneCtx);
  if (!ctx) {
    throw new Error("useWorldScene must be used within a WorldSceneProvider");
  }
  return ctx;
}
