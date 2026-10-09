"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ASSETS } from "@/data/assets";
import { getStageSize } from "@/lib/stage";
import { Bird, type BirdSpec } from "./Bird";
import { useCompositionMode } from "./CompositionModeContext";

// Birds are a rare, distant event. The first flight comes a little while
// after the exterior appears; after that the randomised gaps are long, so
// the sky never feels metronomic or busy.
const FIRST_FLIGHT_DELAY_MS = { min: 10000, max: 20000 };
const GAP_MS = { min: 40000, max: 70000 };

// One bird on screen at a time. The gaps above already outlast any flight,
// so this only ever matters after a freeze; a spawn that would overlap is
// simply skipped until the next gap.
const MAX_LIVE_BIRDS = 1;

// Matches the opacity transition on .flyer-sprite, with a little slack.
const FADE_OUT_MS = 350;

// Durations cover the whole crossing (stage width plus the sprite's own
// canvas), and are slow on purpose: distant birds drift rather than dart.
// Scale shrinks the 400x250 art canvas down to a far-off silhouette.
const FLIGHT = {
  desktop: { minDuration: 30, maxDuration: 40, minScale: 0.32, maxScale: 0.48 },
  portrait: { minDuration: 24, maxDuration: 32, minScale: 0.4, maxScale: 0.56 },
};

// Upper-to-mid sky, as a fraction of stage height -- never down at ground
// level. Measured at the art's centre, not the canvas top. Starts just
// below the airplane's band (see AirplaneLayer) so the two never cross.
const Y_BAND = { top: 0.13, bottom: 0.32 };

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createBird(mode: "desktop" | "portrait", id: number): BirdSpec {
  const { width, height } = getStageSize(mode);
  const flight = FLIGHT[mode];
  const { designWidth, designHeight } = ASSETS.ambientBird;

  return {
    id,
    // The canvas enters at the right edge and travels its own width past
    // the left one, so the (centred) art is fully off-stage at both ends.
    startX: width,
    y: between(Y_BAND.top, Y_BAND.bottom) * height - designHeight / 2,
    travel: -(width + designWidth),
    rise: between(-25, 25),
    duration: between(flight.minDuration, flight.maxDuration),
    scale: between(flight.minScale, flight.maxScale),
  };
}

interface BirdLayerProps {
  // Whether new flights should be scheduled at all.
  spawning: boolean;
  // The cabin has started opening: fade out what's airborne and stop.
  clearing: boolean;
  // Hold any airborne bird exactly where it is -- see useEnvironmentMotion.
  frozen: boolean;
}

// Ambient birds for the CLOSED exterior only. They are scheduled on a plain
// randomised timer rather than modelled, and each flight is a single CSS
// transform animation (see the `flyer-fly` keyframes in globals.css).
//
// Randomness only ever runs inside timer callbacks, never during render, so
// there is nothing for the server and client to disagree about.
export function BirdLayer({ spawning, clearing, frozen }: BirdLayerProps) {
  const mode = useCompositionMode();
  const [birds, setBirds] = useState<BirdSpec[]>([]);
  const nextId = useRef(0);

  // Self-rescheduling timeout rather than an interval: each gap is drawn
  // independently, so the rhythm doesn't repeat.
  useEffect(() => {
    if (!spawning) return;

    let timer: ReturnType<typeof setTimeout>;

    function schedule(delay: { min: number; max: number }) {
      timer = setTimeout(() => {
        setBirds((live) => {
          if (live.length >= MAX_LIVE_BIRDS) return live;
          const bird = createBird(mode, nextId.current);
          nextId.current += 1;
          return [...live, bird];
        });
        schedule(GAP_MS);
      }, between(delay.min, delay.max));
    }

    schedule(FIRST_FLIGHT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [spawning, mode]);

  // The cabin is opening: birds fade (the opacity transition lives on
  // .flyer-sprite) and are then dropped, so the OPEN state has none at all.
  useEffect(() => {
    if (!clearing) return;
    const timer = setTimeout(() => setBirds([]), FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [clearing]);

  const removeBird = useCallback((id: number) => {
    setBirds((live) => live.filter((bird) => bird.id !== id));
  }, []);

  if (birds.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${frozen ? "env-frozen" : ""}`}
    >
      {birds.map((spec) => (
        <Bird key={spec.id} spec={spec} fading={clearing} onFinished={() => removeBird(spec.id)} />
      ))}
    </div>
  );
}
