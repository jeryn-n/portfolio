import { CabinScene } from "@/components/scenes/CabinScene";
import { CabinStateProvider } from "@/components/scenes/CabinStateContext";
import { SceneStage } from "@/components/scenes/SceneStage";
import { ViewportNavArrows } from "@/components/scenes/ViewportNavArrows";

export default function Home() {
  return (
    <CabinStateProvider>
      <SceneStage viewportUI={<ViewportNavArrows />}>
        <CabinScene />
      </SceneStage>
    </CabinStateProvider>
  );
}
