import { SceneStage } from "@/components/scenes/SceneStage";
import { ViewportNavArrows } from "@/components/scenes/ViewportNavArrows";
import { WorldSceneController } from "@/components/scenes/WorldSceneController";

// Providers and the site-wide viewport UI (menu / sound / About / Education)
// live in AppProviders, mounted once from the root layout, so they persist
// across client-side route changes. Only the scene-travel arrows are
// homepage-specific, so only they are passed in here.
export default function Home() {
  return (
    <SceneStage viewportUI={<ViewportNavArrows />}>
      <WorldSceneController />
    </SceneStage>
  );
}
