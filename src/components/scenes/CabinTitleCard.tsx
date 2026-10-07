"use client";

import { motion } from "motion/react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";

interface CabinTitleCardProps {
  x: number;
  y: number;
  revealed: boolean;
  revealDelay: number;
}

const titleCard = ASSETS.titleCard;

// Decorative roof signage revealed alongside the interior. Carries real copy
// but is never clickable.
export function CabinTitleCard({ x, y, revealed, revealDelay }: CabinTitleCardProps) {
  return (
    <motion.div
      aria-hidden={!revealed}
      className="pointer-events-none absolute"
      style={{ left: x, top: y, width: titleCard.designWidth, height: titleCard.designHeight }}
      initial={{ opacity: 0 }}
      animate={{ opacity: revealed ? 1 : 0 }}
      transition={{ duration: 0.5, delay: revealDelay, ease: [0.4, 0, 0.2, 1] }}
    >
      <ArtAsset asset={titleCard} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
        <span className="text-sm font-semibold text-paper">Jeryn Nyberg</span>
        <span className="text-[11px] uppercase tracking-wide text-paper/80">Digital Creator</span>
      </div>
    </motion.div>
  );
}
