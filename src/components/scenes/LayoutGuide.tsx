"use client";

import { useSearchParams } from "next/navigation";
import { ASSETS } from "@/data/assets";
import {
  CABIN_HEIGHT,
  CABIN_INTERIOR_LAYOUT,
  CABIN_WIDTH,
  EXTERIOR_ART_HEIGHT,
  EXTERIOR_ART_WIDTH,
  getSceneLayout,
} from "@/lib/layout";
import type { CompositionMode } from "@/lib/stage";

// Current state of the cabin's environmental systems, shown as plain status
// text. Individual snowflakes and birds are deliberately not labelled.
interface EnvironmentStatus {
  snow: string;
  clouds: string;
  birds: string;
  airplane: string;
}

interface LayoutGuideProps {
  mode: CompositionMode;
  environment?: EnvironmentStatus;
}

// Lightweight non-production composition guide for layout calibration.
// Activated by ?debug=layout -- never affects layout or intercepts pointer
// events, and renders nothing without the query parameter. Distinguishes
// three categories: WORLD/STAGE elements (cabin, clouds, sign, title card),
// CABIN-LOCAL elements (interior props + door hint), and VIEWPORT UI (nav
// arrows -- those render their own "Viewport UI" badge in SceneArrow since
// they live outside this stage-coordinate SVG entirely).
export function LayoutGuide({ mode, environment }: LayoutGuideProps) {
  const searchParams = useSearchParams();
  const showGuide = searchParams.get("debug") === "layout";

  if (!showGuide) return null;

  const layout = getSceneLayout(mode);
  const stageW = layout.stageWidth;
  const stageH = layout.stageHeight;
  const cabinX = layout.cabinX;
  const cabinY = layout.cabinY;

  const modeLabel = mode === "desktop" ? `DESKTOP ${stageW}×${stageH}` : `PORTRAIT / MOBILE ${stageW}×${stageH}`;

  const titleCard =
    layout.mode === "desktop"
      ? layout.titleCard
      : { x: layout.titleCardX, y: layout.cabinY + layout.titleCardOffsetFromCabinY };
  const houseSign =
    layout.mode === "desktop"
      ? layout.houseSign
      : { x: layout.houseSignX, y: layout.cabinY + layout.houseSignOffsetFromCabinY };

  // The shell as actually drawn on the stage: desktop scales it once by
  // shellScale, portrait by its closed scale -- both from the top-center.
  const shellScale = layout.mode === "desktop" ? layout.cabinArt.shellScale : layout.cabinScale.closedScale;
  const shellW = CABIN_WIDTH * shellScale;
  const shellH = CABIN_HEIGHT * shellScale;
  const shellX = cabinX + (CABIN_WIDTH - shellW) / 2;
  const shellY = cabinY;

  // Desktop: closed art group, centered in the stable shell. Portrait: the
  // whole group at its open scale, also from the top-center.
  const closedArt =
    layout.mode === "desktop"
      ? {
          w: shellW * layout.cabinArt.closedArtScale,
          h: shellH * layout.cabinArt.closedArtScale,
        }
      : null;
  const portraitOpen =
    layout.mode === "portrait"
      ? { w: CABIN_WIDTH * layout.cabinScale.openScale, h: CABIN_HEIGHT * layout.cabinScale.openScale }
      : null;

  const rearClouds = layout.clouds.filter((cloud) => cloud.layer === "rear").length;
  const frontClouds = layout.clouds.length - rearClouds;

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 left-0 top-0 h-full w-full">
        {/* WORLD/STAGE: stage outline + centerlines */}
        <rect x={0} y={0} width={stageW} height={stageH} fill="none" stroke="#00ff00" strokeWidth="2" opacity="0.3" />
        <line x1={stageW / 2} y1={0} x2={stageW / 2} y2={stageH} stroke="#00ff00" strokeWidth="1" opacity="0.2" strokeDasharray="4,4" />
        <line x1={0} y1={stageH / 2} x2={stageW} y2={stageH / 2} stroke="#00ff00" strokeWidth="1" opacity="0.2" strokeDasharray="4,4" />

        {/* WORLD/STAGE: cabin logical shell -- the stable 640x720 positioning
            surface. On desktop this never scales between closed/open; only
            the art group inside it (blue, below) resizes. */}
        <rect x={shellX} y={shellY} width={shellW} height={shellH} fill="none" stroke="#ffff00" strokeWidth="2" opacity="0.5" />
        <line x1={shellX + shellW / 2} y1={shellY} x2={shellX + shellW / 2} y2={shellY + shellH} stroke="#ffff00" strokeWidth="1" opacity="0.3" strokeDasharray="4,4" />
        <line x1={shellX} y1={shellY + shellH / 2} x2={shellX + shellW} y2={shellY + shellH / 2} stroke="#ffff00" strokeWidth="1" opacity="0.3" strokeDasharray="4,4" />

        {/* WORLD/STAGE: desktop closed art bounds -- blue shows the
            replaceable artwork group against the stable yellow shell (open
            art is exactly the shell). */}
        {closedArt && (
          <rect
            x={shellX + (shellW - closedArt.w) / 2}
            y={shellY + (shellH - closedArt.h) / 2}
            width={closedArt.w}
            height={closedArt.h}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            opacity="0.6"
          />
        )}
        {/* WORLD/STAGE: portrait open bounds (dashed) -- the whole group
            grows to this from the top-center as the cabin opens. */}
        {portraitOpen && (
          <rect
            x={cabinX + (CABIN_WIDTH - portraitOpen.w) / 2}
            y={cabinY}
            width={portraitOpen.w}
            height={portraitOpen.h}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
            opacity="0.45"
            strokeDasharray="6,3"
          />
        )}

        {/* WORLD/STAGE: title card + house sign bounds */}
        <rect x={titleCard.x} y={titleCard.y} width={ASSETS.titleCard.designWidth} height={ASSETS.titleCard.designHeight} fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
        <rect x={houseSign.x} y={houseSign.y} width={ASSETS.houseSign.designWidth} height={ASSETS.houseSign.designHeight} fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.5" />

        {/* CABIN-LOCAL: interior asset bounds, mapped onto the (scaled) shell */}
        {Object.entries(CABIN_INTERIOR_LAYOUT).map(([key, val]) => {
          const stageX = shellX + val.x * shellScale;
          const stageY = shellY + val.y * shellScale;
          const w = "width" in val ? val.width * shellScale : 0;
          const h = "height" in val ? val.height * shellScale : 0;

          if (w === 0 || h === 0) {
            return <circle key={key} cx={stageX} cy={stageY} r="6" fill="none" stroke="#ff00ff" strokeWidth="1" opacity="0.6" />;
          }

          return <rect key={key} x={stageX} y={stageY} width={w} height={h} fill="none" stroke="#ff00ff" strokeWidth="1" opacity="0.5" />;
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 text-[10px] text-green-400/70">
        <div className="absolute left-1 top-1 space-y-0.5">
          <div>{modeLabel}</div>
          <div className="text-emerald-300/80">
            EXTERIOR -- sky layer + mountains-ground layer, {EXTERIOR_ART_WIDTH}×{EXTERIOR_ART_HEIGHT} master, one shared crop:
            ×{layout.exterior.scale.toFixed(3)} at ({Math.round(layout.exterior.x)}, {Math.round(layout.exterior.y)})
          </div>
          <div className="text-emerald-300/80">
            CLOUDS -- {rearClouds} rear (behind mountains) / {frontClouds} front
          </div>
          {layout.mode === "desktop" ? (
            <>
              <div className="text-yellow-300/80">CABIN LOGICAL SHELL {CABIN_WIDTH}×{CABIN_HEIGHT} -- stable, shellScale {layout.cabinArt.shellScale}</div>
              <div className="text-blue-400/80">CABIN ART GROUP (exterior + front wall + interior) -- closed {Math.round(layout.cabinArt.closedArtScale * 100)}% → open 100% of shell, centered</div>
            </>
          ) : (
            <div className="text-yellow-300/80">
              WORLD/STAGE -- cabin {CABIN_WIDTH}×{CABIN_HEIGHT}, closed scale {layout.cabinScale.closedScale} / open scale {layout.cabinScale.openScale}
            </div>
          )}
          {layout.mode === "portrait" && (
            <>
              <div className="text-cyan-300/80">
                title Y = cabinY ({cabinY}) + ({layout.titleCardOffsetFromCabinY}) = {cabinY + layout.titleCardOffsetFromCabinY}
              </div>
              <div className="text-cyan-300/80">
                sign Y = cabinY ({cabinY}) + ({layout.houseSignOffsetFromCabinY}) = {cabinY + layout.houseSignOffsetFromCabinY}
              </div>
              <div className="text-cyan-300/80">cloud scale ×{layout.cloudScale} (independent of cabin)</div>
            </>
          )}
          <div className="text-magenta-400/80">CABIN-LOCAL -- interior props + door hint (magenta)</div>
          <div className="text-blue-300/80">VIEWPORT UI -- Experience/Projects arrows are fixed to the real viewport, not shown on this stage SVG</div>
          {environment && (
            <>
              <div className="text-white/70">Snow: {environment.snow}</div>
              <div className="text-white/70">Cloud speed: {environment.clouds}</div>
              <div className="text-white/70">Bird spawning: {environment.birds}</div>
              <div className="text-white/70">Airplane spawning: {environment.airplane}</div>
            </>
          )}
        </div>
        <div
          className="absolute border border-yellow-400/50 px-1 text-yellow-400/70"
          style={{
            left: `${(shellX / stageW) * 100}%`,
            top: `${(shellY / stageH) * 100}%`,
            width: `${(shellW / stageW) * 100}%`,
            height: `${(shellH / stageH) * 100}%`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "4px",
          }}
        >
          SHELL {CABIN_WIDTH}×{CABIN_HEIGHT}
        </div>
        {Object.entries(CABIN_INTERIOR_LAYOUT).map(([key, val]) => (
          <div
            key={key}
            className="absolute text-magenta-400/60"
            style={{
              left: `${((shellX + val.x * shellScale) / stageW) * 100}%`,
              top: `${((shellY + val.y * shellScale) / stageH) * 100}%`,
              fontSize: "8px",
            }}
          >
            {key} {val.x},{val.y}
          </div>
        ))}
      </div>
    </>
  );
}
