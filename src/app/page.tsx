import { SceneStage } from "@/components/scenes/SceneStage";
import { ViewportNavArrows } from "@/components/scenes/ViewportNavArrows";
import { WorldSceneController } from "@/components/scenes/WorldSceneController";
import { ExteriorLoadingScreen } from "@/components/ui/ExteriorLoadingScreen";

// Providers and the site-wide viewport UI (menu / sound / About / Education)
// live in AppProviders, mounted once from the root layout, so they persist
// across client-side route changes. Only the scene-travel arrows and the
// first-load exterior screen are homepage-specific, so only they live here --
// a portfolio detail route never mounts the loading screen at all.
export default function Home() {
  return (
    <>
      <SceneStage viewportUI={<ViewportNavArrows />}>
        <WorldSceneController />
      </SceneStage>
      <ExteriorLoadingScreen />
    </>
  );
}
