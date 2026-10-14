"use client";

import { createContext, Suspense, useContext, useEffect, useState, type ReactNode } from "react";
import { getCompositionMode, getStageSize, type CompositionMode } from "@/lib/stage";
import { CompositionModeProvider } from "./CompositionModeContext";

interface StageMetrics {
  mode: CompositionMode;
  stageWidth: number;
  stageHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

function computeStageMetrics(viewportWidth: number, viewportHeight: number): StageMetrics {
  const mode = getCompositionMode(viewportWidth, viewportHeight);
  const { width: stageWidth, height: stageHeight } = getStageSize(mode);
  const scale = Math.max(viewportWidth / stageWidth, viewportHeight / stageHeight);

  return {
    mode,
    stageWidth,
    stageHeight,
    scale,
    offsetX: (viewportWidth - stageWidth * scale) / 2,
    offsetY: (viewportHeight - stageHeight * scale) / 2,
  };
}

const StageReadyContext = createContext(false);

// True once the stage has measured the viewport and rendered its scene into
// it -- before that there is nothing of the world on the page at all. Read by
// SceneStage's `overlay` (the homepage's first-load cover).
export function useStageReady(): boolean {
  return useContext(StageReadyContext);
}

interface SceneStageProps {
  children: ReactNode;
  // Rendered as a sibling of the scaled stage div, outside its transform, so
  // viewport-fixed UI (e.g. ViewportNavArrows) sits in real browser pixels
  // instead of being scaled/clipped along with the logical stage.
  viewportUI?: ReactNode;
  // Rendered last and also outside the transform, so a `position: fixed`
  // cover over the whole viewport really is viewport-fixed and on top.
  overlay?: ReactNode;
}

// Picks one of two explicit composition modes from viewport aspect ratio --
// desktop (1920x1080) or portrait (1080x1920) -- and scales that stage to
// cover the real viewport, clipping overflow instead of letterboxing. The
// active mode is exposed via context so a single scene component can look up
// its own mode-specific scene layout while reusing identical state/animation
// logic and the same cabin-local coordinate system in both modes.
export function SceneStage({ children, viewportUI, overlay }: SceneStageProps) {
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
            width: metrics.stageWidth,
            height: metrics.stageHeight,
            transform: `translate(${metrics.offsetX}px, ${metrics.offsetY}px) scale(${metrics.scale})`,
          }}
        >
          <CompositionModeProvider value={metrics.mode}>{children}</CompositionModeProvider>
        </div>
      )}
      {/* viewportUI (e.g. ViewportNavArrows) reads useSearchParams for the
          debug-layout flag; it renders unconditionally (not gated behind
          `metrics`), so it needs its own Suspense boundary to prerender. */}
      <Suspense fallback={null}>{viewportUI}</Suspense>
      <StageReadyContext.Provider value={metrics !== null}>{overlay}</StageReadyContext.Provider>
    </div>
  );
}
