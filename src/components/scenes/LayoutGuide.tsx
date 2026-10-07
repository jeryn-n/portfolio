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
// events, and renders nothing without the query parameter.
export function LayoutGuide({ mode }: LayoutGuideProps) {
  const searchParams = useSearchParams();
  const showGuide = searchParams.get("debug") === "layout";

  if (!showGuide) return null;

  const layout = getSceneLayout(mode);
  const stageW = layout.stageWidth;
  const stageH = layout.stageHeight;
  const cabinX = layout.cabin.x;
  const cabinY = layout.cabin.y;

  const modeLabel = mode === "desktop" ? `DESKTOP ${stageW}×${stageH}` : `PORTRAIT / MOBILE ${stageW}×${stageH}`;

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 left-0 top-0 h-full w-full">
        {/* Stage outline */}
        <rect x={0} y={0} width={stageW} height={stageH} fill="none" stroke="#00ff00" strokeWidth="2" opacity="0.3" />

        {/* Stage centerlines */}
        <line x1={stageW / 2} y1={0} x2={stageW / 2} y2={stageH} stroke="#00ff00" strokeWidth="1" opacity="0.2" strokeDasharray="4,4" />
        <line x1={0} y1={stageH / 2} x2={stageW} y2={stageH / 2} stroke="#00ff00" strokeWidth="1" opacity="0.2" strokeDasharray="4,4" />

        {/* Cabin bounds (unscaled, cabin-local coordinate surface) */}
        <rect x={cabinX} y={cabinY} width={CABIN_WIDTH} height={CABIN_HEIGHT} fill="none" stroke="#ffff00" strokeWidth="2" opacity="0.5" />

        {/* Cabin-local centerlines */}
        <line x1={cabinX + CABIN_WIDTH / 2} y1={cabinY} x2={cabinX + CABIN_WIDTH / 2} y2={cabinY + CABIN_HEIGHT} stroke="#ffff00" strokeWidth="1" opacity="0.3" strokeDasharray="4,4" />
        <line x1={cabinX} y1={cabinY + CABIN_HEIGHT / 2} x2={cabinX + CABIN_WIDTH} y2={cabinY + CABIN_HEIGHT / 2} stroke="#ffff00" strokeWidth="1" opacity="0.3" strokeDasharray="4,4" />

        {/* Scene-level chrome: title card + house sign bounds */}
        <rect x={layout.titleCard.x} y={layout.titleCard.y} width={ASSETS.titleCard.designWidth} height={ASSETS.titleCard.designHeight} fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
        <rect x={layout.houseSign.x} y={layout.houseSign.y} width={ASSETS.houseSign.designWidth} height={ASSETS.houseSign.designHeight} fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.5" />

        {/* Nav arrow anchor points */}
        <circle cx={layout.experienceArrow.x} cy={layout.experienceArrow.y} r="6" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
        <circle cx={layout.projectsArrow.x} cy={layout.projectsArrow.y} r="6" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.6" />

        {/* Interior asset bounds (cabin-local coords, mapped onto the stage) */}
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
        <div className="absolute left-1 top-1">{modeLabel}</div>
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
          Cabin {CABIN_WIDTH}×{CABIN_HEIGHT} (scale {layout.cabin.displayScale})
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
