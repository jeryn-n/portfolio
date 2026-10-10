"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { MediaFrame } from "@/components/art/MediaFrame";
import type { ArtAssetDef } from "@/data/assets";
import { getEntryHref, type PortfolioEntry } from "@/data/portfolio";

interface EntryPreviewProps {
  entry: PortfolioEntry;
  shellAsset: ArtAssetDef;
  align: "left" | "right";
  // Mirrors the shell artwork only; the content block is never flipped.
  flipShell?: boolean;
  // Renders the whole entry -- shell art, preview, text, spacing -- at this
  // multiple of its design size by sizing it directly rather than with a
  // transform, so text stays crisp and the 3:2 preview keeps its shape.
  contentScale?: number;
  // Title/tagline size, if it should differ from contentScale.
  textScale?: number;
  // "dark" (navy) text reads on a light shell such as the Experience clouds.
  tone?: "light" | "dark";
  // Explicit content geometry, in px of the rendered shell: the preview's
  // width, its distance from the shell's aligned edge, and the (possibly
  // wider) text column sharing that edge. Without these the content block
  // is the default 62% of the padded shell.
  mediaWidth?: number;
  contentInset?: number;
  textWidth?: number;
  // Downward nudges, px, of the preview, the title and the tagline.
  mediaOffsetY?: number;
  textOffsetY?: number;
  taglineOffsetY?: number;
}

// How far the pointer may travel between press and release and still count as
// a tap. A deliberate vertical swipe (>=120px, see useSceneNavigation) is
// scene travel, not a click on whatever card it happened to start on -- some
// browsers still fire a click on the anchor afterwards, so the anchor
// cancels its own default when the pointer clearly moved.
const TAP_SLOP = 12;

// The cloud/boulder shell is a purely decorative backdrop: it sits outside
// the hit target, never animates, and is hidden from assistive tech. Only the
// inner content block is interactive, and it is the real link to the entry's
// detail route. The content sits above every shell (z-[1]), so a neighbouring
// entry's overlapping shell art never covers it.
export function EntryPreview({
  entry,
  shellAsset,
  align,
  flipShell = false,
  contentScale = 1,
  textScale = contentScale,
  tone = "light",
  mediaWidth,
  contentInset = 0,
  textWidth = mediaWidth,
  mediaOffsetY = 0,
  textOffsetY = 0,
  taglineOffsetY = textOffsetY,
}: EntryPreviewProps) {
  const [active, setActive] = useState(false);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const s = contentScale;
  const t = textScale;
  const textColor = tone === "dark" ? "text-ink" : "text-paper";
  const subTextColor = tone === "dark" ? "text-ink-soft" : "text-paper";

  function handlePointerDown(event: PointerEvent<HTMLAnchorElement>) {
    pressOrigin.current = { x: event.clientX, y: event.clientY };
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const origin = pressOrigin.current;
    pressOrigin.current = null;
    // No recorded press means keyboard activation -- always let that through.
    if (!origin) return;
    const travelled = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
    if (travelled > TAP_SLOP) event.preventDefault();
  }

  return (
    <div className="relative" data-entry-slug={entry.slug}>
      <div
        aria-hidden="true"
        className="pointer-events-none select-none"
        style={flipShell ? { transform: "scaleX(-1)" } : undefined}
      >
        <ArtAsset
          asset={shellAsset}
          style={{ width: shellAsset.designWidth * s, height: shellAsset.designHeight * s, maxWidth: "none" }}
        />
      </div>

      <div
        className={`absolute inset-0 z-[1] flex flex-col justify-center ${mediaWidth === undefined ? "p-[6%]" : ""} ${
          align === "right" ? "items-end" : "items-start"
        }`}
        style={
          mediaWidth === undefined
            ? undefined
            : align === "right"
              ? { paddingRight: contentInset }
              : { paddingLeft: contentInset }
        }
      >
        <Link
          href={getEntryHref(entry)}
          aria-label={`${entry.title}: ${entry.tagline}`}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          style={mediaWidth === undefined ? { minWidth: 180 * s } : { width: Math.max(mediaWidth, textWidth ?? 0) }}
          className={`block ${mediaWidth === undefined ? "w-[62%]" : ""} select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${
            tone === "dark" ? "focus-visible:outline-ink" : "focus-visible:outline-paper"
          } ${align === "right" ? "text-right" : "text-left"}`}
        >
          <motion.div
            onHoverStart={() => setActive(true)}
            onHoverEnd={() => setActive(false)}
            onTapStart={() => setActive(true)}
            onTap={() => setActive(false)}
            onTapCancel={() => setActive(false)}
            animate={{ scale: active ? 1.03 : 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div
              className={`relative ${align === "right" ? "ml-auto" : ""}`}
              style={{ width: mediaWidth, top: mediaOffsetY }}
            >
              <MediaFrame
                src={entry.displayImage}
                alt={entry.title}
                objectPosition={entry.displayImagePosition}
                active={active}
              />
            </div>
            {/* text-sm / text-xs / mt-2, scaled by textScale. */}
            <motion.h3
              className={`relative font-bold uppercase tracking-wide ${textColor}`}
              style={{ top: textOffsetY, marginTop: 8 * t, fontSize: 14 * t, lineHeight: `${20 * t}px` }}
              animate={{ opacity: active ? 1 : 0.85, scale: active ? 1.02 : 1 }}
              transition={{ duration: 0.18 }}
            >
              {entry.title}
            </motion.h3>
            <motion.p
              className={`relative ${subTextColor}`}
              style={{ top: taglineOffsetY, fontSize: 12 * t, lineHeight: `${16 * t}px` }}
              animate={{ opacity: active ? 0.95 : tone === "dark" ? 0.85 : 0.7 }}
              transition={{ duration: 0.18 }}
            >
              {entry.tagline}
            </motion.p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
