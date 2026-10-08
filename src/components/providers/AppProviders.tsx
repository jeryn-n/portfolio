"use client";

import type { ReactNode } from "react";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { CabinStateProvider } from "@/components/scenes/CabinStateContext";
import { SiteUIProvider } from "@/components/ui/SiteUIProvider";

// Single client boundary mounted from the root (Server Component) layout, so
// the page/layout themselves don't need to become client components. All
// state here persists through future client-side route changes and resets
// only on a full browser refresh -- nothing is written to storage.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      <SiteUIProvider>
        <CabinStateProvider>{children}</CabinStateProvider>
      </SiteUIProvider>
    </AudioProvider>
  );
}
