"use client";

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
export function AppProviders({ children }: { children: ReactNode }) {
  return (
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
  );
}
