"use client";

import { useCallback, useState } from "react";
import { DevelopmentNotice } from "./DevelopmentNotice";
import { ExteriorLoadingScreen } from "./ExteriorLoadingScreen";

// The homepage's SceneStage overlay: the first-load cover, and the
// development notice that fades in once the cover has gone.
export function HomeOverlay() {
  const [coverGone, setCoverGone] = useState(false);
  const handleCoverDone = useCallback(() => setCoverGone(true), []);
  return (
    <>
      <ExteriorLoadingScreen onDone={handleCoverDone} />
      <DevelopmentNotice visible={coverGone} />
    </>
  );
}
