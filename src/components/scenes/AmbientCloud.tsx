"use client";

import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import { useRef } from "react";
import { ArtAsset } from "@/components/art/ArtAsset";
import type { ArtAssetDef } from "@/data/assets";

interface AmbientCloudProps {
  asset: ArtAssetDef;
  x: number;
  y: number;
  // Right-to-left speed in stage pixels per second. 0 holds the cloud still
  // (reduced motion) without unmounting or re-laying-out anything.
  speed: number;
  // The wrap period: how far this cloud travels before the loop repeats, and
  // equally the gap to its trailing copy. The cabin scene passes one stage
  // width, so a copy enters the right edge exactly as the original leaves the
  // left.
  wrapWidth: number;
  // Clouds are environment objects, not cabin-local -- portrait renders them
  // larger via PORTRAIT_LAYOUT.cloudScale, multiplied by each cloud's own
  // slight size variation.
  scale?: number;
  // Mirrors the sprite horizontally (in place, around its own centre).
  flip?: boolean;
  paused?: boolean;
}

// A single slow cloud, looping cleanly from right to left.
//
// Position is integrated per frame into a motion value rather than being
// driven by a keyframed animation, for one reason: the cabin opening changes
// cloud speed, and re-timing a keyframe animation (CSS or Motion) mid-flight
// snaps its progress, which is a visible jump. Integrating a RATE instead
// means a speed change is only a change in velocity -- the slowdown is smooth
// and the wrap stays exact. Motion values write straight to the DOM without
// re-rendering React, so this costs no state updates per frame, and Motion
// folds the callback into its own single frame loop.
export function AmbientCloud({ asset, x, y, speed, wrapWidth, scale = 1, flip = false, paused = false }: AmbientCloudProps) {
  const travelled = useRef(0);
  const offset = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    if (paused || speed === 0) return;
    // Modulo keeps the accumulator bounded forever, and makes the reset at
    // the end of each period land exactly on the trailing copy's position.
    travelled.current = (travelled.current + (delta / 1000) * speed) % wrapWidth;
    offset.set(-travelled.current);
  });

  // Each copy is its own box at the asset's own size, so the default
  // centre transform-origin of the scale below means the same thing it did
  // before this component looped -- the duplicate never shifts it. A flip is
  // just a negative X scale around that same centre.
  //
  // maxWidth: Tailwind's preflight caps every <img> at 100% of its container,
  // and the trailing copy is positioned a full wrap period past its
  // container's edge -- without this it collapses to 0px wide and the loop
  // pops back in instead of wrapping.
  const scaleX = flip ? -scale : scale;
  const sprite = (
    <ArtAsset
      asset={asset}
      style={{ maxWidth: "none", transform: scaleX === 1 ? undefined : `scale(${scaleX}, ${scale})` }}
    />
  );

  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x, top: y, x: offset }}>
      {sprite}
      {/* The trailing copy, exactly one wrap period to the right: this is
          what makes the reset at the end of each period invisible. */}
      <div className="absolute top-0" style={{ left: wrapWidth }}>
        {sprite}
      </div>
    </motion.div>
  );
}
