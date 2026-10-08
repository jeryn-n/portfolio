"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface PanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// Shared full informational panel used by About and Education. Desktop:
// ~40-50% viewport width, capped so it never gets huge. Mobile: nearly full
// width with a small outer margin. The world behind it stays fixed -- only
// the backdrop + panel animate.
export function Panel({ open, onClose, title, children }: PanelProps) {
  const headingId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="relative flex max-h-[90dvh] w-[calc(100vw-2rem)] flex-col overflow-hidden border-4 border-ink-soft bg-paper text-ink shadow-xl sm:max-h-[85dvh] md:aspect-[4/5] md:h-auto md:max-h-[80dvh] md:w-[45vw] md:max-w-xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between border-b-2 border-ink-soft px-4 py-3">
              <h2 id={headingId} className="text-sm font-bold uppercase tracking-wide">
                {title}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center border-2 border-ink-soft text-sm font-bold hover:bg-ink-soft hover:text-paper"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 text-sm leading-relaxed">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
