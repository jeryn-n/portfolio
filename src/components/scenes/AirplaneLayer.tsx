"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";
import { getStageSize } from "@/lib/stage";
import { useCompositionMode } from "./CompositionModeContext";

// Rarer than the birds: a single far-off airplane every couple of minutes.
const FIRST_FLIGHT_DELAY_MS = { min: 25000, max: 45000 };
const GAP_MS = { min: 90000, max: 150000 };

// Long, slow crossings and a small scale -- it should read as cruising
// altitude, not a flyby.
const FLIGHT = {
  desktop: { minDuration: 50, maxDuration: 65, minScale: 0.18, maxScale: 0.24 },
  portrait: { minDuration: 38, maxDuration: 50, minScale: 0.24, maxScale: 0.3 },
};

// High sky only, as a fraction of stage height at the art's centre. Kept
// above the birds' band (see BirdLayer), so a bird can never fly across it.
const Y_BAND = { top: 0.03, bottom: 0.07 };

interface AirplaneFlight {
  id: number;
  startX: number;
  y: number;
  travel: number;
  rise: number;
  duration: number;
  scale: number;
}

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createFlight(mode: "desktop" | "portrait", id: number): AirplaneFlight {
  const { width, height } = getStageSize(mode);
  const flight = FLIGHT[mode];
  const { designWidth, designHeight } = ASSETS.ambientAirplane;

  return {
    id,
    // Left to right: the canvas starts one canvas-width off the left edge
    // and travels until it has fully cleared the right one.
    startX: -designWidth,
    y: between(Y_BAND.top, Y_BAND.bottom) * height - designHeight / 2,
    travel: width + designWidth,
    rise: between(-15, 15),
    duration: between(flight.minDuration, flight.maxDuration),
    scale: between(flight.minScale, flight.maxScale),
  };
}

interface AirplaneLayerProps {
  // Whether new flights should be scheduled at all.
  spawning: boolean;
  // Hold an airborne airplane exactly where it is -- see useEnvironmentMotion.
  frozen: boolean;
}

// A rare, distant airplane crossing the high sky. Same approach as the
// birds -- a randomised timer plus one CSS transform animation (the shared
// `flyer-fly` keyframes) -- but there is only ever one, and it has no
// interaction, so a single nullable flight is all the state it needs.
//
// Unlike the birds it isn't tied to the closed cabin: it is high enough to
// pass over the open cabin too, as part of the outdoors.
export function AirplaneLayer({ spawning, frozen }: AirplaneLayerProps) {
  const mode = useCompositionMode();
  const [flight, setFlight] = useState<AirplaneFlight | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    if (!spawning) return;

    let timer: ReturnType<typeof setTimeout>;

    function schedule(delay: { min: number; max: number }) {
      timer = setTimeout(() => {
        // Still airborne from last time (only possible after a freeze)?
        // Leave it be and wait for the next gap.
        setFlight((current) => current ?? createFlight(mode, nextId.current++));
        schedule(GAP_MS);
      }, between(delay.min, delay.max));
    }

    schedule(FIRST_FLIGHT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [spawning, mode]);

  if (!flight) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${frozen ? "env-frozen" : ""}`}
    >
      <div
        key={flight.id}
        className="flyer-sprite"
        style={
          {
            left: flight.startX,
            top: flight.y,
            animationDuration: `${flight.duration}s`,
            "--flyer-travel": `${flight.travel}px`,
            "--flyer-rise": `${flight.rise}px`,
          } as CSSProperties
        }
        onAnimationEnd={() => setFlight(null)}
      >
        {/* The art faces left; mirrored so it flies nose-first. maxWidth
            opts out of Tailwind's preflight img cap, which would otherwise
            shrink the sprite whenever it starts near a container edge. */}
        <ArtAsset
          asset={ASSETS.ambientAirplane}
          style={{
            transform: `scale(${-flight.scale}, ${flight.scale})`,
            transformOrigin: "50% 50%",
            maxWidth: "none",
          }}
        />
      </div>
    </div>
  );
}
