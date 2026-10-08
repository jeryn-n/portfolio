import { SoundButton } from "@/components/audio/SoundButton";
import { CabinScene } from "@/components/scenes/CabinScene";
import { SceneStage } from "@/components/scenes/SceneStage";
import { ViewportNavArrows } from "@/components/scenes/ViewportNavArrows";
import { AboutPanel } from "@/components/ui/AboutPanel";
import { EducationPanel } from "@/components/ui/EducationPanel";
import { MasterMenu } from "@/components/ui/MasterMenu";

// CabinStateProvider/AudioProvider/SiteUIProvider now live in AppProviders,
// mounted once from the root layout.
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
      <CabinScene />
    </SceneStage>
  );
}
