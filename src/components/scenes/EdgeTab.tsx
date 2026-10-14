"use client";

import { motion } from "motion/react";

type TabEdge = "top" | "bottom";

interface EdgeTabProps {
  edge: TabEdge;
  ariaLabel: string;
  label: string;
  revealed: boolean;
  interactive: boolean;
  revealDelay: number;
  onActivate: () => void;
}

// How much of the tab is tucked past the screen edge at rest (px); the rest
// of it is the visible body. On hover or focus it slides 5px further in (the
// translate classes on the button).
const TUCK = 8;
const TAB_WIDTH = 220;
const TAB_HEIGHT = 44;

const REVEAL_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const HIDE_TRANSITION = { duration: 0.12, ease: "easeOut" } as const;

// A pointing triangle in a hard-edged pixel step, drawn rather than typed so
// it's the same crisp shape in every font.
function Pointer({ down }: { down: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 9 5"
      width={9 * 1.75}
      height={5 * 1.75}
      shapeRendering="crispEdges"
      fill="currentColor"
      className={down ? "rotate-180" : ""}
    >
      <path d="M4 0h1v1H4zM3 1h3v1H3zM2 2h5v1H2zM1 3h7v1H1zM0 4h9v1H0z" />
    </svg>
  );
}

// Desktop's world control (Experience / Projects from the cabin, Go Home from
// those): a narrow navy tab on the top or
// bottom edge of the viewport, partly tucked off-screen, in the same blocky
// pixel language as the sign. Resting at ~78% opacity, it comes to full
// opacity and slides a few px further in on hover or keyboard focus -- no
// glow, no bounce. The whole tab is the button.
//
// Like SceneArrow it lives in the viewport-fixed UI layer, and `revealed` /
// `interactive` mean exactly what they do there: `revealed` fades it in and
// out with the cabin, `interactive` separately allows the click.
export function EdgeTab({ edge, ariaLabel, label, revealed, interactive, revealDelay, onActivate }: EdgeTabProps) {
  const top = edge === "top";
  const edgeStyle = top
    ? { top: `calc(env(safe-area-inset-top, 0px) - ${TUCK}px)` }
    : { bottom: `calc(env(safe-area-inset-bottom, 0px) - ${TUCK}px)` };
  const hiddenY = top ? -TAB_HEIGHT : TAB_HEIGHT;
  const enabled = revealed && interactive;

  // The wrapper never takes pointer events itself, so a hidden tab can't
  // block clicks on the scene beneath it.
  return (
    <motion.div
      className="pointer-events-none fixed left-1/2 z-10 -translate-x-1/2"
      style={edgeStyle}
      aria-hidden={!revealed}
      initial={{ opacity: 0, y: hiddenY }}
      animate={
        revealed
          ? { opacity: 1, y: 0, transition: { duration: 0.5, delay: revealDelay, ease: REVEAL_EASE } }
          : { opacity: 0, y: hiddenY, transition: HIDE_TRANSITION }
      }
    >
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onActivate}
        disabled={!revealed || !interactive}
        className={`group block bg-transparent p-0 opacity-80 transition-[opacity,translate] duration-150 ease-out focus-visible:opacity-100 focus-visible:outline-none ${
          top ? "hover:translate-y-[5px] focus-visible:translate-y-[5px]" : "hover:-translate-y-[5px] focus-visible:-translate-y-[5px]"
        } hover:opacity-100 ${enabled ? "pointer-events-auto cursor-pointer" : "pointer-events-none"}`}
      >
        {/* Two stacked, identically stair-stepped boxes: the outer one is the
            light-blue edge, the inner (inset 2px) the navy face. */}
        <span
          className={`pixel-tab ${top ? "pixel-tab-top" : "pixel-tab-bottom"} relative block bg-[#6f9fd6] transition-colors group-focus-visible:bg-[#cfe6ff]`}
          style={{ width: TAB_WIDTH, height: TAB_HEIGHT }}
        >
          <span
            className={`pixel-tab ${top ? "pixel-tab-top" : "pixel-tab-bottom"} absolute inset-[2px] flex items-center justify-center gap-2 bg-[#12294a] text-white ${
              top ? "pt-[7px]" : "pb-[7px]"
            }`}
          >
            {top && <Pointer down={false} />}
            <span className="font-pixel-label text-[16px] uppercase leading-none tracking-[0.12em]">{label}</span>
            {!top && <Pointer down />}
          </span>
        </span>
      </button>
    </motion.div>
  );
}
