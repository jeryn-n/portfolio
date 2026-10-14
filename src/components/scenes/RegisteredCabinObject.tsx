"use client";

import { motion, useAnimationControls, type Transition, type Variants } from "motion/react";
import type { ReactNode } from "react";
import type { ArtAssetDef } from "@/data/assets";
import {
  CABIN_HEIGHT,
  CABIN_WIDTH,
  FIRE_GLOW_ORIGIN,
  LANTERN_GLOW_ORIGIN,
  type CabinObjectBounds,
} from "@/lib/layout";
import { useDebugLayout } from "@/lib/useDebugLayout";
import { useImageFallback } from "@/lib/useImageFallback";

// Hover/focus growth: a short ease-out in, a slightly shorter one back.
// Explicit tweens -- Motion's default for transforms is a spring, which
// overshoots. Reduced motion needs nothing extra here: the app's
// MotionConfig (AppProviders) already makes transform animations instant.
const GROW: Transition = { duration: 0.17, ease: "easeOut" };
const SETTLE: Transition = { duration: 0.15, ease: "easeOut" };
// A button gives a little while it's pressed -- on touch screens, which
// never hover, that's the only feedback.
const PRESS: Transition = { duration: 0.08, ease: "easeOut" };
const PRESS_SCALE = 0.98;

// A click's one small hop (the cat): up a few cabin px and back, stretching
// as it rises and squashing a touch on landing, then exactly at rest. Keyframes
// with a duration are a tween -- no spring, no overshoot. The first keyframe
// is null so a click mid-hop carries on from where it is rather than popping.
const BOUNCE = {
  y: [null, -6, 0, 0],
  scaleX: [null, 0.97, 1.04, 1],
  scaleY: [null, 1.04, 0.94, 1],
  transition: { duration: 0.32, times: [0, 0.4, 0.75, 1], ease: ["easeOut", "easeIn", "easeOut"] },
} satisfies Parameters<ReturnType<typeof useAnimationControls>["start"]>[0];

const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper";

interface OverlayImageProps {
  asset: ArtAssetDef;
  // Smooth scaling instead of pixelated, for soft art (the fire's glow).
  smooth?: boolean;
  // From the owner's useImageFallback(), which renders nothing at all once
  // the file has failed.
  imageRef: (img: HTMLImageElement | null) => void;
  onError: () => void;
  className?: string;
}

// An overlay file, filling the 640x720 cabin-local box it's placed in. It's
// decorative (alt="" -- the button over it carries the name) and never a
// pointer target, since its transparent canvas covers the whole cabin. A
// missing file renders nothing rather than a placeholder: a stand-in the
// size of the cabin would hide the interior under it.
export function OverlayImage({ asset, smooth = false, imageRef, onError, className = "" }: OverlayImageProps) {
  return (
    // Plain <img>, like ArtAsset, for the onError fallback and pixelated rendering.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={asset.src}
      alt=""
      width={asset.designWidth}
      height={asset.designHeight}
      draggable={false}
      decoding="async"
      // Not seen until the cabin opens, so it never competes with the
      // first-frame art the loading screen is waiting on.
      fetchPriority="low"
      onError={onError}
      className={`pointer-events-none absolute inset-0 h-full w-full max-w-none select-none ${className}`}
      style={{ imageRendering: smooth ? "auto" : "pixelated" }}
    />
  );
}

// A registered overlay that is only ever drawn -- the fire, an animated WebP
// the browser loops by itself.
export function RegisteredCabinArt({ asset }: { asset: ArtAssetDef }) {
  const { failed, ref, onError } = useImageFallback();
  return failed ? null : <OverlayImage asset={asset} imageRef={ref} onError={onError} />;
}

// The fire's glow: a soft overlay behind the fire that pulses like changing
// firelight. The unevenness lives in two CSS keyframe sequences of different
// lengths (opacity and scale, see globals.css), so the pulse never settles
// into one repeating beat and nothing is driven from React. A missing file
// renders nothing.
export function FireGlow({ asset }: { asset: ArtAssetDef }) {
  const { failed, ref, onError } = useImageFallback();
  if (failed) return null;
  return (
    <div
      aria-hidden="true"
      className="fire-glow pointer-events-none absolute inset-0"
      style={{ transformOrigin: `${FIRE_GLOW_ORIGIN.x}px ${FIRE_GLOW_ORIGIN.y}px` }}
    >
      <OverlayImage asset={asset} smooth imageRef={ref} onError={onError} className="fire-glow-image" />
    </div>
  );
}

// The exterior lantern's glow: the same kind of overlay as FireGlow, pulsed
// more gently (see the lantern-glow keyframes). Lives with the closed
// exterior and fades out with it. A missing file renders nothing.
export function LanternGlow({ asset }: { asset: ArtAssetDef }) {
  const { failed, ref, onError } = useImageFallback();
  if (failed) return null;
  return (
    <div
      aria-hidden="true"
      className="lantern-glow pointer-events-none absolute inset-0"
      style={{ transformOrigin: `${LANTERN_GLOW_ORIGIN.x}px ${LANTERN_GLOW_ORIGIN.y}px` }}
    >
      <OverlayImage asset={asset} smooth imageRef={ref} onError={onError} className="lantern-glow-image" />
    </div>
  );
}

interface RegisteredCabinObjectProps {
  asset: ArtAssetDef;
  bounds: CabinObjectBounds;
  // Off while the cabin is closed or still opening: no hover, no clicks.
  active: boolean;
  // With onClick (or bounce) it's a real <button>, named by `label` or else
  // by its children. Without, it's a hover region only -- no role, no focus
  // stop, nothing for a screen reader to land on.
  onClick?: () => void;
  // A click also makes the art hop once (see BOUNCE). It's a separate
  // transform from the hover growth, on the art inside the growing window,
  // so the two never interfere.
  bounce?: boolean;
  label?: string;
  // Laid over the art inside the same window, so it scales with it. In
  // cabin-local px, like everything else.
  children?: ReactNode;
}

// One interior object: its full-canvas overlay seen through its
// CABIN_OBJECTS box. The box is a window -- the overlay sits inside it moved
// back by the box's own offset, so the art stays exactly registered and only
// the box's part of the canvas shows. The window, not the whole canvas, is
// what grows on hover, about its own transformOrigin, so the object grows
// from the edge it rests on rather than drifting with the canvas. The hitbox
// is the same box but never scales, so hover can't flicker at its edges.
export function RegisteredCabinObject({ asset, bounds, active, onClick, bounce, label, children }: RegisteredCabinObjectProps) {
  const { failed, ref, onError } = useImageFallback();
  const bounceControls = useAnimationControls();
  const debug = useDebugLayout();
  const { x, y, width, height, hoverScale, transformOrigin } = bounds;
  // A missing overlay keeps its hitbox but not its growth: there'd be nothing
  // to grow -- or, for the sign, only its text, over a board drawn elsewhere.
  const responsive = active && !failed;

  function handleClick() {
    if (bounce && !failed) void bounceControls.start(BOUNCE);
    onClick?.();
  }

  const variants: Variants = {
    rest: { scale: 1, transition: SETTLE },
    hover: { scale: hoverScale, transition: GROW },
    press: { scale: PRESS_SCALE, transition: PRESS },
  };

  // Follows the hitbox's gesture state by variant label.
  const art = (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ transformOrigin }} variants={variants}>
      <motion.div
        className="absolute"
        // The hop squashes and stretches about the object's own base.
        style={{ left: -x, top: -y, width: CABIN_WIDTH, height: CABIN_HEIGHT, transformOrigin: `${x + width / 2}px ${y + height}px` }}
        animate={bounceControls}
      >
        {!failed && <OverlayImage asset={asset} imageRef={ref} onError={onError} />}
        {children}
      </motion.div>
    </motion.div>
  );
  const box = { left: x, top: y, width, height };

  return (
    <>
      {/* Calibration aid: the whole overlay, faint and unclipped, so any of
          its art falling outside the box shows. */}
      {debug && !failed && <OverlayImage asset={asset} imageRef={ref} onError={onError} className="opacity-30" />}

      {onClick || bounce ? (
        <motion.button
          type="button"
          aria-label={label}
          onClick={handleClick}
          disabled={!active}
          initial="rest"
          animate="rest"
          whileHover={responsive ? "hover" : undefined}
          whileFocus={responsive ? "hover" : undefined}
          whileTap={responsive ? "press" : undefined}
          className={`absolute cursor-pointer border-0 bg-transparent p-0 disabled:pointer-events-none disabled:cursor-default ${FOCUS_RING}`}
          style={box}
        >
          {art}
        </motion.button>
      ) : (
        <motion.div
          aria-hidden="true"
          initial="rest"
          animate="rest"
          whileHover={responsive ? "hover" : undefined}
          className={`absolute ${active ? "" : "pointer-events-none"}`}
          style={box}
        >
          {art}
        </motion.div>
      )}
    </>
  );
}
