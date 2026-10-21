import type { Metadata } from "next";
import { SceneStage } from "@/components/scenes/SceneStage";
import { ViewportNavArrows } from "@/components/scenes/ViewportNavArrows";
import { WorldSceneController } from "@/components/scenes/WorldSceneController";
import { ExteriorLoadingScreen } from "@/components/ui/ExteriorLoadingScreen";

export const metadata: Metadata = {
  alternates: { canonical: "https://imjeryn.dev" },
};

// Providers and the site-wide viewport UI (menu / sound / About / Education)
// live in AppProviders, mounted once from the root layout, so they persist
// across client-side route changes. Only the scene-travel arrows and the
// first-load exterior screen are homepage-specific, so only they live here --
// a portfolio detail route never mounts the loading screen at all. The
// loading screen is SceneStage's overlay, so it knows when the world under
// it has been rendered.
export default function Home() {
  return (
    <SceneStage viewportUI={<ViewportNavArrows />} overlay={<ExteriorLoadingScreen />}>
      <WorldSceneController />
    </SceneStage>
  );
}
