"use client";

import { ASSETS } from "@/data/assets";
import { SITE } from "@/data/site";
import { CABIN_ART_HOTSPOTS, CABIN_HEIGHT, CABIN_WIDTH } from "@/lib/layout";
import { useImageFallback } from "@/lib/useImageFallback";
import { OverlayImage } from "./RegisteredCabinObject";

const { pictureFrame: frame, pictureFrameLeft: leftHalf } = CABIN_ART_HOTSPOTS;

// Two invisible click targets side by side; their focus ring sits just inside
// the frame, where there's room for it.
const HALF_CLASS =
  "absolute top-0 h-full cursor-pointer border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-paper disabled:cursor-default";

interface PictureFrameProps {
  // Off while the cabin is closed or still opening: no hover, no clicks, no
  // focus stops.
  active: boolean;
  onLinkedIn?: () => void;
  onAbout: () => void;
}

// The picture frame above the fireplace: icons.png draws both icons as one
// registered overlay, and the frame's box is the interaction area, split into
// two invisible halves -- left opens LinkedIn, right opens About Me.
//
// The icons themselves have no hover effect; the halves are the click targets.
export function PictureFrame({ active, onLinkedIn, onAbout }: PictureFrameProps) {
  const { failed, ref, onError } = useImageFallback();

  return (
    <div
      className={`absolute ${active ? "" : "pointer-events-none"}`}
      style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}
    >
      {/* The icons overlay, registered on the cabin canvas: the frame's box
          shows its part of it. Drawn only -- never a pointer target. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute" style={{ left: -frame.x, top: -frame.y, width: CABIN_WIDTH, height: CABIN_HEIGHT }}>
          {!failed && <OverlayImage asset={ASSETS.cabinIcons} imageRef={ref} onError={onError} />}
        </div>
      </div>

      <a
        href={SITE.linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open LinkedIn profile"
        aria-disabled={!active}
        tabIndex={active ? undefined : -1}
        onClick={onLinkedIn}
        className={`${HALF_CLASS} left-0 ${active ? "" : "pointer-events-none"}`}
        style={{ width: leftHalf.width }}
      />
      <button
        type="button"
        aria-label="Open About Me"
        disabled={!active}
        onClick={onAbout}
        className={`${HALF_CLASS} right-0 disabled:pointer-events-none`}
        style={{ width: frame.width - leftHalf.width }}
      />
    </div>
  );
}
