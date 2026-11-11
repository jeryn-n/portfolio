"use client";

// Plain <img>s, like ArtAsset, for the onError fallback and pixelated rendering.
/* eslint-disable @next/next/no-img-element */

import type { CSSProperties } from "react";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { ASSETS, type ArtAssetDef } from "@/data/assets";
import { useImageFallback } from "@/lib/useImageFallback";
import { SOUND_BUTTON_DEV_NOTICE_SHIFT, SOUND_BUTTON_ICON_SIZE, VOLUME_PANEL } from "@/lib/viewportUi";
import { useAudio, useMasterVolume } from "./AudioProvider";

// Stands in for a missing icon file: a plain speaker on the art's own 12x12
// grid (inside the files' 1px margin), with sound waves when on and a cross
// when muted.
function FallbackSpeaker({ on }: { on: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="-1 -1 14 14"
      width={SOUND_BUTTON_ICON_SIZE}
      height={SOUND_BUTTON_ICON_SIZE}
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      <path d="M1 4h2v4H1zM3 3h1v6H3zM4 2h1v8H4zM5 1h1v10H5z" />
      {on ? (
        <path d="M7 5h1v2H7zM8 3h1v1H8zM9 4h1v4H9zM8 8h1v1H8z" />
      ) : (
        <path d="M7 4h1v1H7zM10 4h1v1h-1zM8 5h2v2H8zM7 7h1v1H7zM10 7h1v1h-1z" />
      )}
    </svg>
  );
}

// One state's icon. Both stay mounted (the hidden one invisible but loaded),
// so a toggle never flashes; a missing file shows FallbackSpeaker instead.
function SoundIcon({ asset, shown, on }: { asset: ArtAssetDef; shown: boolean; on: boolean }) {
  const { failed, ref, onError } = useImageFallback();
  if (failed) return shown ? <FallbackSpeaker on={on} /> : null;
  return (
    <img
      ref={ref}
      src={asset.src}
      alt=""
      width={SOUND_BUTTON_ICON_SIZE}
      height={SOUND_BUTTON_ICON_SIZE}
      draggable={false}
      onError={onError}
      className={`pointer-events-none absolute select-none ${shown ? "" : "invisible"}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// The slider panel's reveal. It opens while the pointer is anywhere over the
// control (the button, or the open panel itself -- it adjoins the button, so
// there's no gap to cross), while either has keyboard focus, and while the
// slider is held (:active lasts until the button is released, wherever the
// pointer has gone, so a drag never loses it). Closing waits a moment
// (delay-150), forgiving a pointer that slips off. Hover only counts on
// devices that have it (Tailwind's hover variants): a tap on a phone just
// mutes or unmutes, and the device's own volume buttons do the rest.
const PANEL_SHOWN =
  "group-hover/sound:visible group-hover/sound:translate-x-0 group-hover/sound:opacity-100 group-hover/sound:delay-0 " +
  "group-has-[:focus-visible]/sound:visible group-has-[:focus-visible]/sound:translate-x-0 group-has-[:focus-visible]/sound:opacity-100 group-has-[:focus-visible]/sound:delay-0 " +
  "group-active/sound:visible group-active/sound:translate-x-0 group-active/sound:opacity-100 group-active/sound:delay-0";

// The master sound control, fixed in the bottom-right corner above the scene:
// the mute button, with the master volume slider opening out to its left.
// While the development notice covers that corner, the whole control slides
// left out from under it. Not shown on the video portfolio, which plays none
// of the site's sound.
export function SoundButton() {
  const { masterSoundEnabled, routeIsolated, toggleMaster, setMasterVolume, beginVolumeGesture } = useAudio();
  const masterVolume = useMasterVolume();
  const { devNoticeShowing } = useSiteUI();

  if (routeIsolated) return null;

  // The slider shows the volume, muted or not (the icon shows which).
  const percent = Math.round(masterVolume * 100);

  return (
    <div
      className={`group/sound fixed z-40 [transition:translate_220ms_ease-out] motion-reduce:transition-none ${
        devNoticeShowing ? SOUND_BUTTON_DEV_NOTICE_SHIFT : ""
      }`}
      style={{
        bottom: "calc(1rem + env(safe-area-inset-bottom))",
        right: "calc(1rem + env(safe-area-inset-right))",
        width: SOUND_BUTTON_ICON_SIZE,
        height: SOUND_BUTTON_ICON_SIZE,
      }}
    >
      <button
        type="button"
        aria-label={masterSoundEnabled ? "Mute sound" : "Turn sound on"}
        onClick={toggleMaster}
        className="absolute inset-0 flex items-center justify-center text-white opacity-90 drop-shadow-[0_1px_2px_rgba(11,29,51,0.45)] [transition:scale_100ms_ease-out,opacity_150ms_ease-out] hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper active:scale-90 motion-reduce:transition-none"
      >
        <SoundIcon asset={ASSETS.uiSoundOn} shown={masterSoundEnabled} on />
        <SoundIcon asset={ASSETS.uiSoundOff} shown={!masterSoundEnabled} on={false} />
      </button>

      <div
        className={`volume-panel invisible absolute top-1/2 right-full flex -translate-y-1/2 translate-x-[5px] items-center justify-center opacity-0 transition-[opacity,translate,visibility] delay-150 duration-150 ease-out motion-reduce:transition-none ${PANEL_SHOWN}`}
        style={{ width: VOLUME_PANEL.width, height: VOLUME_PANEL.height }}
      >
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          aria-label="Master volume"
          aria-valuetext={masterSoundEnabled ? `${percent}%` : `${percent}%, muted`}
          onPointerDown={beginVolumeGesture}
          onFocus={beginVolumeGesture}
          onChange={(event) => setMasterVolume(Number(event.currentTarget.value) / 100)}
          className="volume-slider"
          style={{ width: VOLUME_PANEL.sliderWidth, "--volume": percent / 100 } as CSSProperties}
        />
      </div>
    </div>
  );
}
