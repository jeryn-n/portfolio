"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { MediaFrame } from "@/components/art/MediaFrame";
import type { ArtAssetDef } from "@/data/assets";
import type { PortfolioEntry } from "@/data/portfolio";

interface EntryPreviewProps {
  entry: PortfolioEntry;
  shellAsset: ArtAssetDef;
  align: "left" | "right";
}

// The cloud/boulder shell is a purely decorative backdrop and never
// animates. Only the inner content block (preview frame + title/tagline)
// responds to hover/press, and it's intentionally non-navigating in P4 --
// routes are wired in P5.
export function EntryPreview({ entry, shellAsset, align }: EntryPreviewProps) {
  const [active, setActive] = useState(false);

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
        <motion.div
          role="group"
          aria-label={`${entry.title} -- ${entry.tagline}`}
          className={`w-[62%] min-w-[180px] cursor-default select-none ${align === "right" ? "text-right" : "text-left"}`}
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
      </div>
    </div>
  );
}
