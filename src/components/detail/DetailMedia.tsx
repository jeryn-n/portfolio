"use client";

import { useState } from "react";
import type { MediaType } from "@/data/portfolio";

interface DetailMediaProps {
  src: string;
  alt: string;
  objectPosition?: string;
  mediaType?: MediaType;
}

// Light-surface wireframe stand-in, matching the detail page's white/blue
// palette rather than the dark scene palette MediaFrame uses.
function MediaFallback({ label, detail }: { label: string; detail: string }) {
  return (
    <div
      role="img"
      aria-label={`${label} (placeholder)`}
      className="relative flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed border-wireframe-border bg-wireframe-fill p-4 text-center"
    >
      <span aria-hidden="true" className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-wireframe-border/40" />
      <span aria-hidden="true" className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-wireframe-border/40" />
      <span className="relative text-xs font-bold uppercase tracking-wide text-ink-soft sm:text-sm">{label}</span>
      <span className="relative break-all text-[9px] text-ink-soft/70 sm:text-[10px]">{detail}</span>
    </div>
  );
}

// Fills whatever 16:9 box the detail page's carousel gives it. Real portfolio
// media doesn't exist yet, so a missing/failed file renders the wireframe
// stand-in in the exact same bounds -- never the browser's broken-image UI.
//
// Video playback isn't implemented. Rather than invent behavior for it, a
// `mediaType: "video"` slide renders an explicit unsupported notice, which
// keeps the data shape usable today without pretending it works.
export function DetailMedia({ src, alt, objectPosition = "center", mediaType = "image" }: DetailMediaProps) {
  const [failed, setFailed] = useState(false);

  if (mediaType === "video") {
    return <MediaFallback label="Video preview not supported yet" detail={src} />;
  }

  if (failed) {
    return <MediaFallback label={alt} detail={src} />;
  }

  return (
    // Plain <img> keeps us in control of the onError fallback, matching ArtAsset.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      decoding="async"
      className="h-full w-full object-cover"
      style={{ objectPosition }}
      onError={() => setFailed(true)}
    />
  );
}
