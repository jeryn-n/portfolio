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
// detail route.
export function EntryPreview({ entry, shellAsset, align }: EntryPreviewProps) {
  const [active, setActive] = useState(false);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);

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
      <div aria-hidden="true" className="pointer-events-none select-none">
        <ArtAsset asset={shellAsset} />
      </div>

      <div
        className={`absolute inset-0 flex flex-col justify-center p-[6%] ${
          align === "right" ? "items-end" : "items-start"
        }`}
      >
        <Link
          href={getEntryHref(entry)}
          aria-label={`${entry.title}: ${entry.tagline}`}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          className={`block w-[62%] min-w-[180px] select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper ${
            align === "right" ? "text-right" : "text-left"
          }`}
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
            <MediaFrame
              src={entry.displayImage}
              alt={entry.title}
              objectPosition={entry.displayImagePosition}
              active={active}
            />
            <motion.h3
              className="mt-2 text-sm font-bold uppercase tracking-wide text-paper"
              animate={{ opacity: active ? 1 : 0.85, scale: active ? 1.02 : 1 }}
              transition={{ duration: 0.18 }}
            >
              {entry.title}
            </motion.h3>
            <motion.p
              className="text-xs text-paper"
              animate={{ opacity: active ? 0.95 : 0.7 }}
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
