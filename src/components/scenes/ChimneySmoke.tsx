"use client";

import { useMemo, type CSSProperties } from "react";
import { useCompositionMode } from "./CompositionModeContext";

// A tall, steady column in the spirit of Minecraft campfire smoke: big,
// chunky pixel puffs climbing slowly right off the top of the screen. Every
// puff shares one rise time and they're evenly staggered, so a new puff
// leaves the chimney on a steady beat: one every PUFF_DURATION / PUFF_COUNT
// seconds (~0.64s).
const PUFF_COUNT = 28;
const PUFF_DURATION = 18;

// Cool greys nudged towards the scene's blues, plus near-whites -- listed
// twice so roughly two puffs in five are the almost-white ones.
const SHADES = ["#fafbfd", "#f1f3f6", "#fafbfd", "#f1f3f6", "#dde1e6", "#cdd2d8", "#bec4cb"];

// All in cabin-local px/seconds: the smoke lives in the cabin's art group, so
// it scales with the closed cabin in both composition modes. The rise is
// enough to clear the top of either stage from the chimney (desktop's mouth
// sits at ~y 390, portrait's at ~y 770).
const SHAPE = {
  minSize: 70,
  maxSize: 100,
  minEndScale: 1.5,
  maxEndScale: 2.1,
  minRise: 850,
  maxRise: 1000,
  // The wind blows to the left, so every puff leans left -- more the higher
  // it climbs (see the smoke-rise keyframes).
  minLean: 220,
  maxLean: 330,
  // On top of the lean, each puff fans out to one side or the other as it
  // climbs, so the column widens. Reached in full at the end of the rise; by
  // the top of a desktop screen (about halfway up) it's ~37% of this, about
  // +/-100 screen px.
  maxSpread: 440,
  // Opaque at the start of a puff's life (it fades only at the very end).
  minOpacity: 0.75,
  maxOpacity: 1,
};

// Portrait/mobile keeps this fraction of the sideways spread.
const PORTRAIT_SPREAD_FACTOR = 0.5;

// Each puff starts at this fraction of its base size and swells to endScale.
const START_SCALE = 0.42;

interface Puff {
  id: number;
  size: number;
  endScale: number;
  rise: number;
  lean: number;
  spread: number;
  jitter: number;
  delay: number;
  opacity: number;
  color: string;
}

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Puff i starts i/PUFF_COUNT of the way through the shared cycle (a negative
// delay), so the column is already full on the first frame and the beat
// never drifts. Only each puff's look -- size, lean, shade, opacity -- is
// randomised, never its timing.
function createPuffs(spreadFactor: number): Puff[] {
  return Array.from({ length: PUFF_COUNT }, (_, id) => ({
    id,
    size: between(SHAPE.minSize, SHAPE.maxSize),
    endScale: between(SHAPE.minEndScale, SHAPE.maxEndScale),
    rise: between(SHAPE.minRise, SHAPE.maxRise),
    lean: -between(SHAPE.minLean, SHAPE.maxLean),
    spread: between(-SHAPE.maxSpread, SHAPE.maxSpread) * spreadFactor,
    jitter: between(-10, 10),
    delay: -(id / PUFF_COUNT) * PUFF_DURATION,
    opacity: between(SHAPE.minOpacity, SHAPE.maxOpacity),
    color: SHADES[Math.floor(Math.random() * SHADES.length)],
  }));
}

interface ChimneySmokeProps {
  // The chimney mouth, in cabin-local px.
  x: number;
  y: number;
  // True holds every puff exactly where it is -- see useEnvironmentMotion.
  frozen: boolean;
}

// Chimney smoke: chunky pixel puffs in greys and near-whites that swell as
// they rise, drifting left with the wind -- on the closed exterior and the
// open cabin alike. CSS animations only, randomised once on mount (see the `smoke-rise` keyframes
// in globals.css), like SnowLayer. No hydration risk for the same reason: the
// cabin scene only ever first renders on the client.
//
// CabinScene mounts this behind the cabin's art, so each puff comes out from
// behind the chimney cap.
export function ChimneySmoke({ x, y, frozen }: ChimneySmokeProps) {
  // Randomised once, then left alone -- nothing about the puffs is state.
  // On a phone (portrait) the column fans out half as much.
  const spreadFactor = useCompositionMode() === "portrait" ? PORTRAIT_SPREAD_FACTOR : 1;
  const puffs = useMemo(() => createPuffs(spreadFactor), [spreadFactor]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${frozen ? "env-frozen" : ""}`}
      style={{ left: x, top: y }}
    >
      {/* Each puff's box is its FULL, final size and the animation scales it
          down from there: a growing scale would be drawn at its small starting
          size and stretched, blurring the stepped pixel edges. */}
      {puffs.map((puff) => (
        <span
          key={puff.id}
          className="smoke-puff"
          style={
            {
              animationDuration: `${PUFF_DURATION}s`,
              animationDelay: `${puff.delay}s`,
              "--smoke-size": `${puff.size * puff.endScale}px`,
              "--smoke-start-scale": START_SCALE / puff.endScale,
              "--smoke-rise": `${puff.rise}px`,
              "--smoke-lean": `${puff.lean}px`,
              "--smoke-spread": `${puff.spread}px`,
              "--smoke-jitter": `${puff.jitter}px`,
              "--smoke-opacity": puff.opacity,
              "--smoke-color": puff.color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
