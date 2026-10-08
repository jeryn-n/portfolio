"use client";

import { motion } from "motion/react";
import { useState } from "react";

interface MediaFrameProps {
  src: string;
  alt: string;
  objectPosition?: string;
  active?: boolean;
  className?: string;
}

// A 3:2 preview frame for data-driven portfolio media (arbitrary paths, not
// the fixed ASSETS manifest ArtAsset covers). Since real portfolio images
// don't exist yet, a missing/failed image renders a clean wireframe
// placeholder in the same bounds -- never a broken-image icon. The frame
// itself never scales; only the image inside it zooms slightly while
// `active`, staying clipped by the frame's rounded, overflow-hidden bounds.
export function MediaFrame({ src, alt, objectPosition = "center", active = false, className }: MediaFrameProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative aspect-[3/2] w-full overflow-hidden rounded border border-dashed border-wireframe-border bg-wireframe-fill ${className ?? ""}`}
    >
      {!failed ? (
        <motion.img
          src={src}
          alt={alt}
          draggable={false}
          decoding="async"
          className="h-full w-full object-cover"
          style={{ objectPosition }}
          animate={{ scale: active ? 1.08 : 1, opacity: active ? 1 : 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1 text-center leading-tight">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-paper">{alt}</span>
          <span className="break-all px-1 text-[7px] text-paper/70">{src}</span>
        </div>
      )}
    </div>
  );
}
