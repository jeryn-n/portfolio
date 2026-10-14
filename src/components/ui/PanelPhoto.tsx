"use client";

import { useCallback, useState } from "react";
import type { ArtAssetDef } from "@/data/assets";
import { mediaFileHint } from "@/data/portfolio";

interface PanelPhotoProps {
  asset: ArtAssetDef;
  alt: string;
  // Size and aspect ratio of the frame, e.g. "aspect-square w-48".
  className: string;
}

// The extensions a photo may be dropped in as: name.png, name.jpg or
// name.jpeg. The asset's own extension is tried first, then the others.
const PHOTO_EXTENSIONS = [".png", ".jpg", ".jpeg"];

function photoCandidates(src: string): string[] {
  const dot = src.lastIndexOf(".");
  const base = src.slice(0, dot);
  const own = src.slice(dot).toLowerCase();
  return [src, ...PHOTO_EXTENSIONS.filter((ext) => ext !== own).map((ext) => base + ext)];
}

// A framed photo for the About / Education panels. The file may be a png, jpg
// or jpeg: each extension is tried in turn, and a missing photo renders a
// light wireframe stand-in in the same bounds, naming the file it expects --
// never the browser's broken-image icon.
export function PanelPhoto({ asset, alt, className }: PanelPhotoProps) {
  const candidates = photoCandidates(asset.src);
  const [attempt, setAttempt] = useState(0);
  const failed = attempt >= candidates.length;
  // Tied to the attempt that failed, so a ref callback and an error event (or
  // Strict Mode's double ref call) for the same attempt only move on once.
  const next = useCallback((from: number) => setAttempt((a) => (a === from ? from + 1 : a)), []);
  // onError alone isn't enough on a prerendered page: an image that fails
  // before hydration has already fired its error event, so catch it as the
  // element mounts.
  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (img?.complete && img.naturalWidth === 0) next(attempt);
    },
    [attempt, next],
  );
  const { file, folder } = mediaFileHint(asset.src);
  const dot = file.lastIndexOf(".");
  const expected = `${file.slice(0, dot)}${PHOTO_EXTENSIONS.join(" / ")}`;

  return (
    <div
      className={`relative shrink-0 overflow-hidden border-4 border-ink-soft bg-wireframe-fill shadow-[5px_5px_0_rgb(28_58_94/0.18)] ${className}`}
    >
      {failed ? (
        <div
          role="img"
          aria-label={`${asset.label} (placeholder: ${folder}${expected})`}
          className="flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed border-wireframe-border p-3 text-center"
        >
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">Photo</span>
          <span className="break-all text-sm font-bold text-ink">{expected}</span>
          <span className="break-all text-[10px] text-ink-soft/70">in {folder}</span>
        </div>
      ) : (
        // Plain <img> keeps us in control of the onError fallback, matching ArtAsset.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={attempt}
          ref={ref}
          src={candidates[attempt]}
          alt={alt}
          width={asset.designWidth}
          height={asset.designHeight}
          draggable={false}
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => next(attempt)}
        />
      )}
    </div>
  );
}
