"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { CabinStateProvider } from "@/components/scenes/CabinStateContext";
import { WorldSceneProvider } from "@/components/scenes/WorldSceneContext";
import { GlobalViewportUI } from "@/components/ui/GlobalViewportUI";
import { SiteUIProvider } from "@/components/ui/SiteUIProvider";
import { RouteSessionSync } from "./RouteSessionSync";

// Single client boundary mounted from the root (Server Component) layout, so
// the page/layout themselves don't need to become client components.
//
// Everything here sits ABOVE the route tree, which is what makes it survive
// client-side navigation: playing music keeps playing when a detail route
// opens, the current world scene is remembered while you're away from the
// homepage, and the global viewport UI (menu / sound / panels) is never
// unmounted or duplicated per page. All of it resets only on a full browser
// refresh -- nothing is written to storage.
// Reduced motion is handled by configuring the animation system we already
// have, not by building a second one. `reducedMotion="user"` makes every
// Motion component in the app skip transform animations (position, scale,
// the stage's large vertical scene travel, the detail carousel's horizontal
// slide) while still animating opacity -- so the cabin reveal becomes a
// cross-fade, scene travel becomes a cut, and the carousel falls back to
// pure fades, with no parallel set of variants to maintain.
//
// It does not cover the three environmental systems that deliberately sit
// outside Motion: snow and birds are CSS keyframes, and the clouds are
// driven by an integrated motion value rather than an animation. Each of
// those checks `useEnvironmentMotion().reducedMotion` for itself.
const REDUCED_MOTION = "user";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion={REDUCED_MOTION}>
      <AudioProvider>
        <SiteUIProvider>
          <CabinStateProvider>
            <WorldSceneProvider>
              <RouteSessionSync />
              {children}
              <GlobalViewportUI />
            </WorldSceneProvider>
          </CabinStateProvider>
        </SiteUIProvider>
      </AudioProvider>
    </MotionConfig>
  );
}
