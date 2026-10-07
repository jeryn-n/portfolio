"use client";

import { useSearchParams } from "next/navigation";
import { ASSETS } from "@/data/assets";
import { CABIN_HEIGHT, CABIN_INTERIOR_LAYOUT, CABIN_WIDTH, getSceneLayout } from "@/lib/layout";
import type { CompositionMode } from "@/lib/stage";

interface LayoutGuideProps {
  mode: CompositionMode;
}

// Lightweight non-production composition guide for layout calibration.
// Activated by ?debug=layout -- never affects layout or intercepts pointer
// events, and renders nothing without the query parameter. Distinguishes
// three categories: WORLD/STAGE elements (cabin, clouds, sign, title card),
// CABIN-LOCAL elements (interior props + door hint), and VIEWPORT UI (nav
// arrows -- those render their own "Viewport UI" badge in SceneArrow since
// they live outside this stage-coordinate SVG entirely).
export function LayoutGuide({ mode }: LayoutGuideProps) {
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

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 left-0 top-0 h-full w-full">
        {/* WORLD/STAGE: stage outline + centerlines */}
        <rect x={0} y={0} width={stageW} height={stageH} fill="none" stroke="#00ff00" strokeWidth="2" opacity="0.3" />
        <line x1={stageW / 2} y1={0} x2={stageW / 2} y2={stageH} stroke="#00ff00" strokeWidth="1" opacity="0.2" strokeDasharray="4,4" />
        <line x1={0} y1={stageH / 2} x2={stageW} y2={stageH / 2} stroke="#00ff00" strokeWidth="1" opacity="0.2" strokeDasharray="4,4" />

        {/* WORLD/STAGE: cabin logical shell -- the stable 760x570 positioning
            surface. On desktop this never scales between closed/open; only
            the art layers inside it (blue, below) resize. */}
        <rect x={cabinX} y={cabinY} width={CABIN_WIDTH} height={CABIN_HEIGHT} fill="none" stroke="#ffff00" strokeWidth="2" opacity="0.5" />
        <line x1={cabinX + CABIN_WIDTH / 2} y1={cabinY} x2={cabinX + CABIN_WIDTH / 2} y2={cabinY + CABIN_HEIGHT} stroke="#ffff00" strokeWidth="1" opacity="0.3" strokeDasharray="4,4" />
        <line x1={cabinX} y1={cabinY + CABIN_HEIGHT / 2} x2={cabinX + CABIN_WIDTH} y2={cabinY + CABIN_HEIGHT / 2} stroke="#ffff00" strokeWidth="1" opacity="0.3" strokeDasharray="4,4" />

        {/* WORLD/STAGE: desktop-only art bounds -- blue shows the two
            replaceable artwork layers against the stable yellow shell. */}
        {layout.mode === "desktop" && (
          <>
            <rect
              x={cabinX + (CABIN_WIDTH * (1 - layout.cabinArt.closedArtScale)) / 2}
              y={cabinY + (CABIN_HEIGHT * (1 - layout.cabinArt.closedArtScale)) / 2}
              width={CABIN_WIDTH * layout.cabinArt.closedArtScale}
              height={CABIN_HEIGHT * layout.cabinArt.closedArtScale}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <rect x={cabinX} y={cabinY} width={CABIN_WIDTH} height={CABIN_HEIGHT} fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.35" strokeDasharray="6,3" />
          </>
        )}

        {/* WORLD/STAGE: title card + house sign bounds */}
        <rect x={titleCard.x} y={titleCard.y} width={ASSETS.titleCard.designWidth} height={ASSETS.titleCard.designHeight} fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
        <rect x={houseSign.x} y={houseSign.y} width={ASSETS.houseSign.designWidth} height={ASSETS.houseSign.designHeight} fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.5" />

        {/* CABIN-LOCAL: interior asset bounds, mapped onto the stage */}
        {Object.entries(CABIN_INTERIOR_LAYOUT).map(([key, val]) => {
          const stageX = cabinX + val.x;
          const stageY = cabinY + val.y;
          const w = "width" in val ? val.width : 0;
          const h = "height" in val ? val.height : 0;

          if (w === 0 || h === 0) {
            return <circle key={key} cx={stageX} cy={stageY} r="6" fill="none" stroke="#ff00ff" strokeWidth="1" opacity="0.6" />;
          }

          return <rect key={key} x={stageX} y={stageY} width={w} height={h} fill="none" stroke="#ff00ff" strokeWidth="1" opacity="0.5" />;
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 text-[10px] text-green-400/70">
        <div className="absolute left-1 top-1 space-y-0.5">
          <div>{modeLabel}</div>
          {layout.mode === "desktop" ? (
            <>
              <div className="text-yellow-300/80">CABIN LOGICAL SHELL 760×570 -- stable, shellScale {layout.cabinArt.shellScale}</div>
              <div className="text-blue-400/80">CABIN EXTERIOR ART (closed) -- {Math.round(layout.cabinArt.closedArtScale * 100)}% of shell, centered</div>
              <div className="text-blue-400/80">CABIN INTERIOR ART (open) -- 100% of shell</div>
            </>
          ) : (
            <div className="text-yellow-300/80">
              WORLD/STAGE -- cabin closed scale {layout.cabinScale.closedScale} / open scale {layout.cabinScale.openScale}
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
        </div>
        <div
          className="absolute border border-yellow-400/50 px-1 text-yellow-400/70"
          style={{
            left: `${(cabinX / stageW) * 100}%`,
            top: `${(cabinY / stageH) * 100}%`,
            width: `${(CABIN_WIDTH / stageW) * 100}%`,
            height: `${(CABIN_HEIGHT / stageH) * 100}%`,
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
              left: `${((cabinX + val.x) / stageW) * 100}%`,
              top: `${((cabinY + val.y) / stageH) * 100}%`,
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
