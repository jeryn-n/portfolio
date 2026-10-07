"use client";

import { motion } from "motion/react";
import { ArtAsset } from "@/components/art/ArtAsset";
import type { ArtAssetDef } from "@/data/assets";

interface AmbientCloudProps {
  asset: ArtAssetDef;
  x: number;
  y: number;
  flip?: boolean;
  driftDelay?: number;
}

const DRIFT_DISTANCE = 30;
const DRIFT_DURATION = 50;

// A gentle placeholder drift so the sky doesn't feel static. True continuous
// right-to-left scroll-looping (plus birds traveling with/across the clouds)
// is future work -- see CLAUDE.md.
export function AmbientCloud({ asset, x, y, flip = false, driftDelay = 0 }: AmbientCloudProps) {
  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: y }}
      animate={{ x: [0, -DRIFT_DISTANCE, 0] }}
      transition={{ duration: DRIFT_DURATION, delay: driftDelay, repeat: Infinity, ease: "easeInOut" }}
    >
      <ArtAsset asset={asset} className={flip ? "-scale-x-100" : undefined} />
    </motion.div>
  );
}
