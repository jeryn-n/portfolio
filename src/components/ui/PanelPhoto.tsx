"use client";

import type { ArtAssetDef } from "@/data/assets";
import { mediaFileHint } from "@/data/portfolio";
import { useImageFallback } from "@/lib/useImageFallback";

interface PanelPhotoProps {
  asset: ArtAssetDef;
  alt: string;
  // Size and aspect ratio of the frame, e.g. "aspect-square w-48".
  className: string;
}

// A framed photo for the About / Education panels. A missing file renders a
// light wireframe stand-in in the same bounds, naming the file it expects --
// never the browser's broken-image icon.
export function PanelPhoto({ asset, alt, className }: PanelPhotoProps) {
  const { failed, ref, onError } = useImageFallback();
  const { file, folder } = mediaFileHint(asset.src);

  return (
    <div
      className={`relative shrink-0 overflow-hidden border-4 border-ink-soft bg-wireframe-fill shadow-[5px_5px_0_rgb(28_58_94/0.18)] ${className}`}
    >
      {failed ? (
        <div
          role="img"
          aria-label={`${asset.label} (placeholder: ${folder}${file})`}
          className="flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed border-wireframe-border p-3 text-center"
        >
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">Photo</span>
          <span className="break-all text-sm font-bold text-ink">{file}</span>
          <span className="break-all text-[10px] text-ink-soft/70">in {folder}</span>
        </div>
      ) : (
        // Plain <img> keeps us in control of the onError fallback, matching ArtAsset.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={asset.src}
          alt={alt}
          width={asset.designWidth}
          height={asset.designHeight}
          draggable={false}
          decoding="async"
          className="h-full w-full object-cover"
          onError={onError}
        />
      )}
    </div>
  );
}
