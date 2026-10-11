"use client";

import { motion } from "motion/react";
import { mediaFileHint } from "@/data/portfolio";
import { useImageFallback } from "@/lib/useImageFallback";
import { ComingSoonMedia } from "./ComingSoonMedia";

interface MediaFrameProps {
  src: string;
  alt: string;
  objectPosition?: string;
  active?: boolean;
  className?: string;
  // A solid, slightly rounded border in place of the dashed wireframe one,
  // px.
  border?: { color: string; width: number; radius: number };
  // Lays a delicate grey "Coming Soon" overlay over the image.
  comingSoonOverlay?: boolean;
}

// A 3:2 preview frame for data-driven portfolio media (arbitrary paths, not
// the fixed ASSETS manifest ArtAsset covers). A missing/failed image renders
// a clean wireframe placeholder in the same bounds -- never a broken-image
// icon -- naming the exact file (and folder) it's waiting for. The frame
// itself never scales; only the image inside it zooms slightly while
// `active`, staying clipped by the frame's rounded, overflow-hidden bounds.
export function MediaFrame({
  src,
  alt,
  objectPosition = "center",
  active = false,
  className,
  border,
  comingSoonOverlay = false,
}: MediaFrameProps) {
  const { failed, ref, onError } = useImageFallback();
  const { file, folder } = mediaFileHint(src);

  return (
    <div
      className={`relative aspect-[3/2] w-full overflow-hidden bg-wireframe-fill ${
        border ? "border-solid" : "rounded border border-dashed border-wireframe-border"
      } ${className ?? ""}`}
      style={border ? { borderColor: border.color, borderWidth: border.width, borderRadius: border.radius } : undefined}
    >
      {!failed ? (
        <motion.img
          ref={ref}
          src={src}
          alt={alt}
          draggable={false}
          decoding="async"
          className="h-full w-full object-cover"
          style={{ objectPosition }}
          animate={{ scale: active ? 1.08 : 1, opacity: active ? 1 : 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onError={onError}
        />
      ) : (
        // The frame's fill is see-through, so the text gets its own dark card
        // to stay legible over white clouds and pale rock alike.
        <div className="absolute inset-0 flex items-center justify-center p-2 text-center leading-tight">
          <div className="flex flex-col items-center gap-1 rounded-md bg-ink/75 px-4 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-paper/80">{alt}</span>
            <span className="break-all text-[18px] font-bold text-paper">{file}</span>
            <span className="break-all text-[10px] text-paper/70">in {folder}</span>
          </div>
        </div>
      )}
      {comingSoonOverlay && <ComingSoonMedia overlay textClassName="text-[20px]" />}
    </div>
  );
}
