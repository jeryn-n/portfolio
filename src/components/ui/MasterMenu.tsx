"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { SITE } from "@/data/site";
import { useSiteUI } from "./SiteUIProvider";

type MenuItemKind = "home" | "disabled" | "about" | "resume";

const MENU_ITEMS: Array<{ label: string; kind: MenuItemKind }> = [
  { label: "Home", kind: "home" },
  { label: "Experience", kind: "disabled" },
  { label: "Projects", kind: "disabled" },
  { label: "About", kind: "about" },
  { label: "Resume", kind: "resume" },
];

// Very subtle upper-left menu, only shown once the cabin has been entered.
// Experience/Projects render visibly but disabled -- P4 wires up scene
// travel.
export function MasterMenu() {
  const { hasEnteredCabin, menuOpen, toggleMenu, closeMenu, openPanel } = useSiteUI();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) closeMenu();
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen, closeMenu]);

  if (!hasEnteredCabin) return null;

  function handleItemClick(kind: MenuItemKind) {
    if (kind === "home") {
      closeMenu();
    } else if (kind === "about") {
      openPanel("about");
    } else if (kind === "resume") {
      window.open(SITE.resumeUrl, "_blank", "noopener,noreferrer");
      closeMenu();
    }
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
        className="flex h-10 w-10 flex-col items-center justify-center gap-1 border-2 border-ink-soft/70 bg-paper/80 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft"
      >
        <span aria-hidden="true" className="block h-0.5 w-5 bg-ink-soft" />
        <span aria-hidden="true" className="block h-0.5 w-5 bg-ink-soft" />
        <span aria-hidden="true" className="block h-0.5 w-5 bg-ink-soft" />
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
            {MENU_ITEMS.map((item) => {
              const disabled = item.kind === "disabled";
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={disabled}
                  aria-disabled={disabled}
                  onClick={() => handleItemClick(item.kind)}
                  className="block w-full px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide hover:bg-ink-soft hover:text-paper disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
                >
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
