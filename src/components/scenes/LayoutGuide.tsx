"use client";

import { useSearchParams } from "next/navigation";
import { CABIN_INTERIOR_LAYOUT, CABIN_LAYOUT } from "@/lib/layout";
import { STAGE_HEIGHT, STAGE_WIDTH } from "@/lib/stage";

// Lightweight non-production composition guide for layout calibration.
// Activated by ?debug=layout query parameter.
export function LayoutGuide() {
  const searchParams = useSearchParams();
  const showGuide = searchParams.get("debug") === "layout";

  if (!showGuide) return null;

  const stageW = STAGE_WIDTH;
  const stageH = STAGE_HEIGHT;
  const cabinX = CABIN_LAYOUT.x;
  const cabinY = CABIN_LAYOUT.y;
  const cabinW = CABIN_LAYOUT.width;
  const cabinH = CABIN_LAYOUT.height;

  return (
    <>
      {/* Stage outline (1920×1080) */}
      <svg
        className="pointer-events-none absolute inset-0 left-0 top-0 h-full w-full"
        style={{ position: "absolute" }}
      >
        {/* Stage rect */}
        <rect
          x={0}
          y={0}
          width={stageW}
          height={stageH}
          fill="none"
          stroke="#00ff00"
          strokeWidth="2"
          opacity="0.3"
        />

        {/* Vertical centerline */}
        <line
          x1={stageW / 2}
          y1={0}
          x2={stageW / 2}
          y2={stageH}
          stroke="#00ff00"
          strokeWidth="1"
          opacity="0.2"
          strokeDasharray="4,4"
        />

        {/* Horizontal centerline */}
        <line
          x1={0}
          y1={stageH / 2}
          x2={stageW}
          y2={stageH / 2}
          stroke="#00ff00"
          strokeWidth="1"
          opacity="0.2"
          strokeDasharray="4,4"
        />

        {/* Cabin bounds */}
        <rect
          x={cabinX}
          y={cabinY}
          width={cabinW}
          height={cabinH}
          fill="none"
          stroke="#ffff00"
          strokeWidth="2"
          opacity="0.5"
        />

        {/* Cabin local centerlines (relative to cabin origin) */}
        <line
          x1={cabinX + cabinW / 2}
          y1={cabinY}
          x2={cabinX + cabinW / 2}
          y2={cabinY + cabinH}
          stroke="#ffff00"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="4,4"
        />
        <line
          x1={cabinX}
          y1={cabinY + cabinH / 2}
          x2={cabinX + cabinW}
          y2={cabinY + cabinH / 2}
          stroke="#ffff00"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="4,4"
        />

        {/* Interior asset bounds (in cabin-local coords, mapped to stage) */}
        {Object.entries(CABIN_INTERIOR_LAYOUT).map(([key, val]) => {
          if (!("x" in val)) return null;
          const stageX = cabinX + val.x;
          const stageY = cabinY + val.y;
          const w = "width" in val ? val.width : 0;
          const h = "height" in val ? val.height : 0;

          // For non-box assets, draw a small circle instead
          if (w === 0 || h === 0) {
            return (
              <circle
                key={key}
                cx={stageX}
                cy={stageY}
                r="6"
                fill="none"
                stroke="#ff00ff"
                strokeWidth="1"
                opacity="0.6"
              />
            );
          }

          return (
            <rect
              key={key}
              x={stageX}
              y={stageY}
              width={w}
              height={h}
              fill="none"
              stroke="#ff00ff"
              strokeWidth="1"
              opacity="0.5"
            />
          );
        })}
      </svg>

      {/* Text labels overlaid on top */}
      <div className="pointer-events-none absolute inset-0 text-[10px] text-green-400/70">
        <div className="absolute top-1 left-1">
          Stage: {stageW}×{stageH}
        </div>
        <div
          className="absolute border border-yellow-400/50 px-1 text-yellow-400/70"
          style={{
            left: `${(cabinX / stageW) * 100}%`,
            top: `${(cabinY / stageH) * 100}%`,
            width: `${(cabinW / stageW) * 100}%`,
            height: `${(cabinH / stageH) * 100}%`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "4px",
          }}
        >
          Cabin {cabinW}×{cabinH}
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
