"use client";

import { ComingSoonMedia } from "@/components/art/ComingSoonMedia";
import { mediaFileHint, type MediaType } from "@/data/portfolio";
import { useImageFallback } from "@/lib/useImageFallback";

interface DetailMediaProps {
  src: string;
  alt: string;
  objectPosition?: string;
  mediaType?: MediaType;
  // "card" replaces the media with the grey Coming Soon card; "overlay" keeps
  // it and lays a delicate Coming Soon veil over it.
  comingSoon?: "card" | "overlay";
}

// Light-surface wireframe stand-in, matching the detail page's white/blue
// palette rather than the dark scene palette MediaFrame uses. It leads with
// the exact filename (and folder) the missing image should be saved as.
function MediaFallback({ label, src }: { label: string; src: string }) {
  const { file, folder } = mediaFileHint(src);
  return (
    <div
      role="img"
      aria-label={`${label} (placeholder: ${folder}${file})`}
      className="relative flex h-full w-full items-center justify-center border border-dashed border-wireframe-border bg-wireframe-fill p-4 text-center"
    >
      <span aria-hidden="true" className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-wireframe-border/40" />
      <span aria-hidden="true" className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-wireframe-border/40" />
      <span className="relative flex flex-col items-center gap-1 rounded-md bg-paper/85 px-4 py-2 sm:px-6 sm:py-3">
        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft/70 sm:text-xs">{label}</span>
        <span className="break-all text-base font-bold text-ink sm:text-xl">{file}</span>
        <span className="break-all text-[10px] text-ink-soft/70 sm:text-xs">in {folder}</span>
      </span>
    </div>
  );
}

// Fills whatever 16:9 box the detail page's carousel gives it. A missing or
// failed file renders the wireframe stand-in in the exact same bounds --
// never the browser's broken-image UI.
//
// Video playback isn't implemented. Rather than invent behavior for it, a
// `mediaType: "video"` slide renders an explicit unsupported notice, which
// keeps the data shape usable today without pretending it works.
export function DetailMedia({ src, alt, objectPosition = "center", mediaType = "image", comingSoon }: DetailMediaProps) {
  const { failed, ref, onError } = useImageFallback();

  if (comingSoon === "card") {
    return <ComingSoonMedia textClassName="text-base sm:text-xl" />;
  }

  if (mediaType === "video") {
    return <MediaFallback label="Video preview not supported yet" src={src} />;
  }

  const media = failed ? (
    <MediaFallback label={alt} src={src} />
  ) : (
    // Plain <img> keeps us in control of the onError fallback, matching ArtAsset.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      draggable={false}
      decoding="async"
      className="h-full w-full object-cover"
      style={{ objectPosition }}
      onError={onError}
    />
  );

  if (comingSoon !== "overlay") return media;

  return (
    <>
      {media}
      <ComingSoonMedia overlay textClassName="text-base sm:text-xl" />
    </>
  );
}
