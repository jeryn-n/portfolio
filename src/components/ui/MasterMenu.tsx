"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useWorldScene, type Scene } from "@/components/scenes/WorldSceneContext";
import { SITE } from "@/data/site";
import { useSiteUI } from "./SiteUIProvider";

type MenuItemKind = "home" | "experience" | "projects" | "about" | "resume";

const MENU_ITEMS: Array<{ label: string; kind: MenuItemKind }> = [
  { label: "Home", kind: "home" },
  { label: "Experience", kind: "experience" },
  { label: "Projects", kind: "projects" },
  { label: "About", kind: "about" },
  { label: "Resume", kind: "resume" },
];

// Very subtle upper-left menu, only shown once the cabin has been entered.
// Mounted globally (see GlobalViewportUI) so it persists across routes, which
// makes it route-aware: on the homepage its scene items are animated world
// travel, and on a portfolio detail route they are client-side navigations
// back to the homepage addressed at the right scene.
export function MasterMenu() {
  const { hasEnteredCabin, menuOpen, toggleMenu, closeMenu, openPanel, activePanel, emailPopoverOpen } = useSiteUI();
  const { scene, goTo } = useWorldScene();
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) closeMenu();
    }
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen, closeMenu]);

  // Escape toggles the menu: it opens it, and closes it again. While a panel
  // or the email popover is open, Escape belongs to that instead (each closes
  // itself on the same key press), so the menu stays put.
  useEffect(() => {
    if (!hasEnteredCabin) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (menuOpen) closeMenu();
      else if (!activePanel && !emailPopoverOpen) toggleMenu();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hasEnteredCabin, menuOpen, activePanel, emailPopoverOpen, closeMenu, toggleMenu]);

  if (!hasEnteredCabin) return null;

  const onHomepage = pathname === "/";

  // Homepage: deliberate world travel. These call goTo directly rather than
  // going through useSceneNavigation's `navigate` (which gates on the menu
  // being closed, since that gate exists to stop ambient wheel/swipe/keyboard
  // input while the menu owns focus). Crossing Experience<->Projects skips
  // travel altogether: the menu jumps straight to the other scene, with no
  // transition, recording a history entry like any other move.
  function travelOnHomepage(target: Scene) {
    if (scene === target) return;
    if (target === "cabin" || scene === "cabin") goTo(target);
    else goTo(target, { instant: true, recordHistory: true });
  }

  // Detail routes: the WorldSceneController isn't mounted, so there is no
  // scene state to animate -- we set the destination scene outright (instant,
  // no history push of its own) and let the router carry us to the matching
  // URL. The world then mounts already on that scene, so arrival needs no
  // fake travel and doesn't depend on hash-read timing.
  function routeToScene(target: Scene) {
    goTo(target, { instant: true });
    router.push(target === "cabin" ? "/" : `/#${target}`);
  }

  function handleItemClick(kind: MenuItemKind) {
    if (kind === "about") {
      // openPanel closes the menu itself.
      openPanel("about");
      return;
    }
    if (kind === "resume") {
      window.open(SITE.resumeUrl, "_blank", "noopener,noreferrer");
      closeMenu();
      return;
    }

    const target: Scene = kind === "home" ? "cabin" : kind;
    // Always close the menu before travelling or routing.
    closeMenu();
    if (onHomepage) travelOnHomepage(target);
    else routeToScene(target);
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-40"
      style={{ top: "calc(1rem + env(safe-area-inset-top))", left: "calc(1rem + env(safe-area-inset-left))" }}
    >
      <motion.button
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={toggleMenu}
        whileTap={{ scale: 0.92 }}
        className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-md drop-shadow-[0_1px_2px_rgba(11,29,51,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        {/* Three plain white rounded bars, no frame. The soft drop shadow
            keeps them visible over snow, clouds and the light detail pages. */}
        <span aria-hidden="true" className="block h-[3px] w-6 rounded-full bg-white" />
        <span aria-hidden="true" className="block h-[3px] w-6 rounded-full bg-white" />
        <span aria-hidden="true" className="block h-[3px] w-6 rounded-full bg-white" />
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.16 }}
            className="mt-2 w-40 border-2 border-ink-soft bg-paper py-1 text-ink shadow-md"
          >
            {MENU_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleItemClick(item.kind)}
                className="block w-full px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide hover:bg-ink-soft hover:text-paper"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
