"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MOBILE_BREAKPOINT, MOBILE_ZOOM, STAGE_HEIGHT, STAGE_WIDTH } from "@/lib/stage";

interface StageMetrics {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function computeStageMetrics(viewportWidth: number, viewportHeight: number): StageMetrics {
  const coverScale = Math.max(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT);
  const isMobile = viewportWidth < MOBILE_BREAKPOINT;
  const scale = isMobile ? coverScale * MOBILE_ZOOM : coverScale;

  return {
    scale,
    offsetX: (viewportWidth - STAGE_WIDTH * scale) / 2,
    offsetY: (viewportHeight - STAGE_HEIGHT * scale) / 2,
  };
}

interface SceneStageProps {
  children: ReactNode;
}

// Scales the fixed 1920x1080 reference canvas to cover whatever viewport it's
// given, keeping the composition's proportions intact and clipping overflow
// instead of letterboxing. Mobile applies an extra zoom so foreground art
// reads at a reasonable size; per-breakpoint content overrides can layer on
// top of this later.
export function SceneStage({ children }: SceneStageProps) {
  const [metrics, setMetrics] = useState<StageMetrics | null>(null);

  useEffect(() => {
    function updateMetrics() {
      setMetrics(computeStageMetrics(window.innerWidth, window.innerHeight));
    }

    updateMetrics();
    window.addEventListener("resize", updateMetrics);
    return () => window.removeEventListener("resize", updateMetrics);
  }, []);

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-stage-sky">
      {metrics && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `translate(${metrics.offsetX}px, ${metrics.offsetY}px) scale(${metrics.scale})`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
