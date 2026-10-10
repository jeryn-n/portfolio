"use client";

import { useMemo, type CSSProperties } from "react";
import { useCompositionMode } from "./CompositionModeContext";

// Still conservative: a steady, readable snowfall matters more than
// density, so this is a light fall, never a blizzard. Portrait gets fewer
// flakes over a taller stage.
const FLAKE_COUNT = { desktop: 72, portrait: 40 };

// Sizes, drifts and durations are in STAGE pixels/seconds, so they are
// scaled along with everything else by SceneStage. Portrait's 1080x1920
// canvas is drawn much smaller on a phone than desktop's 1920x1080 is on a
// laptop, so its flakes need to be bigger -- and its fall is nearly twice as
// tall, so the durations are longer for the same apparent speed.
const FLAKE_SHAPE = {
  desktop: { minSize: 4, maxSize: 9, minDuration: 8, maxDuration: 16 },
  portrait: { minSize: 8, maxSize: 18, minDuration: 12, maxDuration: 22 },
};

// "Mostly vertical with very slight drift": the horizontal component is a
// small constant lean per flake, not a simulated sway.
const MAX_DRIFT = 70;

interface Flake {
  id: number;
  leftPercent: number;
  size: number;
  drift: number;
  duration: number;
  delay: number;
  opacity: number;
}

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function shuffled(count: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Even coverage without a visible grid: the stage width is split into one
// column per flake, and each fall into one phase slot per flake, and every
// flake takes one column and one (shuffled) phase slot, jittered inside
// both. Pure randomness leaves clumps and bare strips at these counts.
function createFlakes(count: number, shape: (typeof FLAKE_SHAPE)["desktop"]): Flake[] {
  const phases = shuffled(count);
  return Array.from({ length: count }, (_, id) => {
    const duration = between(shape.minDuration, shape.maxDuration);
    return {
      id,
      leftPercent: ((id + between(0.15, 0.85)) / count) * 100,
      size: between(shape.minSize, shape.maxSize),
      drift: between(-MAX_DRIFT, MAX_DRIFT),
      duration,
      // A NEGATIVE delay starts the flake partway through its fall, so the
      // layer is already full of snow on the first frame instead of dropping
      // one synchronised curtain from the top.
      delay: -((phases[id] + Math.random()) / count) * duration,
      opacity: between(0.35, 0.9),
    };
  });
}

interface SnowLayerProps {
  // False removes the flakes entirely (reduced motion), rather than
  // animating something cheaper.
  enabled: boolean;
  // True holds every flake exactly where it is -- see useEnvironmentMotion.
  frozen: boolean;
}

// Procedural snowfall for the cabin scene only, as a pool of CSS-animated
// flakes. No canvas, no WebGL, no dependency, and no per-frame React state:
// each flake's randomness is generated once on mount and handed to CSS as
// inline custom properties (see the `snow-fall` keyframes in globals.css).
//
// There is no hydration risk in generating the flakes during render here:
// SceneStage only renders its stage children once it has measured the
// viewport in an effect, so this component's first render is always a
// client render, well after hydration. Nothing about the snow is ever part
// of the server's HTML to disagree with.
//
// Layering is handled by the cabin scene: it mounts this in front of the
// cabin, and masks it out over the open cabin so the interior is never
// snowed on. See snowVariants in CabinScene.
export function SnowLayer({ enabled, frozen }: SnowLayerProps) {
  const mode = useCompositionMode();

  // Generated once per composition mode and then left alone -- the flakes
  // are never re-randomised, and nothing about them is React state.
  const flakes = useMemo(
    () => (enabled ? createFlakes(FLAKE_COUNT[mode], FLAKE_SHAPE[mode]) : []),
    [enabled, mode],
  );

  if (flakes.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${frozen ? "env-frozen" : ""}`}
    >
      {flakes.map((flake) => (
        <span
          key={flake.id}
          className="snow-flake"
          style={
            {
              left: `${flake.leftPercent}%`,
              animationDuration: `${flake.duration}s`,
              animationDelay: `${flake.delay}s`,
              "--snow-size": `${flake.size}px`,
              "--snow-drift": `${flake.drift}px`,
              "--snow-opacity": flake.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
