"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { useCabinState } from "@/components/scenes/CabinStateContext";
import { useSiteUI } from "@/components/ui/SiteUIProvider";

// Any initial load that doesn't land on `/` skips the cabin entry gate for
// the rest of the mounted session: there is no closed cabin to click on a
// portfolio detail route, so the world is treated as already entered and the
// cabin as already open. A later client navigation to `/` then shows the
// open cabin directly instead of the closed-exterior intro.
//
// Runs exactly once, against the pathname the session started on -- reaching
// a detail route *from* the homepage already implies an open cabin, so there
// is nothing to re-sync on subsequent route changes.
//
// useLayoutEffect, not useEffect, so the state lands before the first paint
// and nothing (e.g. the master menu, which is gated on hasEnteredCabin)
// flashes in its not-yet-entered form. Nothing is persisted to storage: a
// full refresh re-derives this from the pathname alone.
export function RouteSessionSync() {
  const pathname = usePathname();
  const ran = useRef(false);
  const { setCabinState } = useCabinState();
  const { markCabinEntered } = useSiteUI();

  useLayoutEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (pathname === "/") return;

    setCabinState("open");
    markCabinEntered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
