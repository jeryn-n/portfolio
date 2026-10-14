"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type PanelId = "about" | "education";

interface SiteUIContextValue {
  // Set once the cabin reaches "open" and kept for the rest of the session --
  // lets future cross-route UI (menu, etc.) know the cabin was entered
  // without duplicating a separate isCabinOpen boolean that can drift.
  hasEnteredCabin: boolean;
  markCabinEntered: () => void;

  activePanel: PanelId | null;
  // `returnTo`: the panel this one was opened from. Closing the new panel
  // (the X, Escape or the backdrop) then reopens that one instead of leaving
  // nothing open. Any other way of opening a panel forgets it.
  openPanel: (panel: PanelId, options?: { returnTo?: PanelId }) => void;
  closePanel: () => void;

  emailPopoverOpen: boolean;
  toggleEmailPopover: () => void;
  closeEmailPopover: () => void;

  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;

  // For future snowfall/scene-navigation code to detect a blocking modal.
  // The email popover intentionally does NOT count as blocking.
  isBlockingOverlayOpen: boolean;
}

const SiteUICtx = createContext<SiteUIContextValue | null>(null);

// Session-level UI state: persists through future client-side route changes,
// resets only on a full browser refresh. Deliberately not persisted to
// storage.
export function SiteUIProvider({ children }: { children: ReactNode }) {
  const [hasEnteredCabin, setHasEnteredCabin] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [returnPanel, setReturnPanel] = useState<PanelId | null>(null);
  const [emailPopoverOpen, setEmailPopoverOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const markCabinEntered = useCallback(() => setHasEnteredCabin(true), []);

  const openPanel = useCallback((panel: PanelId, options?: { returnTo?: PanelId }) => {
    setActivePanel(panel);
    setReturnPanel(options?.returnTo ?? null);
    setEmailPopoverOpen(false);
    setMenuOpen(false);
  }, []);
  const closePanel = useCallback(() => {
    setActivePanel(returnPanel);
    setReturnPanel(null);
  }, [returnPanel]);

  const toggleEmailPopover = useCallback(() => setEmailPopoverOpen((prev) => !prev), []);
  const closeEmailPopover = useCallback(() => setEmailPopoverOpen(false), []);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const value: SiteUIContextValue = {
    hasEnteredCabin,
    markCabinEntered,
    activePanel,
    openPanel,
    closePanel,
    emailPopoverOpen,
    toggleEmailPopover,
    closeEmailPopover,
    menuOpen,
    toggleMenu,
    closeMenu,
    isBlockingOverlayOpen: activePanel !== null,
  };

  return <SiteUICtx.Provider value={value}>{children}</SiteUICtx.Provider>;
}

export function useSiteUI(): SiteUIContextValue {
  const ctx = useContext(SiteUICtx);
  if (!ctx) {
    throw new Error("useSiteUI must be used within a SiteUIProvider");
  }
  return ctx;
}
