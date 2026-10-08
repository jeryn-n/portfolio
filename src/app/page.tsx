import { SoundButton } from "@/components/audio/SoundButton";
import { SceneStage } from "@/components/scenes/SceneStage";
import { ViewportNavArrows } from "@/components/scenes/ViewportNavArrows";
import { WorldSceneController } from "@/components/scenes/WorldSceneController";
import { AboutPanel } from "@/components/ui/AboutPanel";
import { EducationPanel } from "@/components/ui/EducationPanel";
import { MasterMenu } from "@/components/ui/MasterMenu";

// CabinStateProvider/AudioProvider/SiteUIProvider/WorldSceneProvider now live
// in AppProviders, mounted once from the root layout.
export default function Home() {
  return (
    <SceneStage
      viewportUI={
        <>
          <ViewportNavArrows />
          <MasterMenu />
          <SoundButton />
          <AboutPanel />
          <EducationPanel />
        </>
      }
    >
      <WorldSceneController />
    </SceneStage>
  );
}
