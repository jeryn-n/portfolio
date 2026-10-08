"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/data/site";

interface EmailPopoverProps {
  x: number;
  y: number;
  open: boolean;
  onClose: () => void;
}

// Small popover anchored near the contact frame -- unlike About/Education,
// this intentionally does NOT dim the rest of the scene.
export function EmailPopover({ x, y, open, onClose }: EmailPopoverProps) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) onClose();
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable -- fail silently rather than throwing.
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-label="Email contact"
          className="absolute z-10 flex items-center gap-1 whitespace-nowrap border-2 border-ink-soft bg-paper px-2 py-1.5 text-ink shadow-md"
          style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.15 }}
        >
          <span className="px-1 text-[11px] font-semibold">{SITE.email}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="border border-ink-soft px-2 py-0.5 text-[10px] font-bold uppercase hover:bg-ink-soft hover:text-paper"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <a
            href={`mailto:${SITE.email}`}
            aria-label="Open email client"
            className="flex items-center justify-center border border-ink-soft px-2 py-0.5 text-[10px] font-bold hover:bg-ink-soft hover:text-paper"
          >
            ↗
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
