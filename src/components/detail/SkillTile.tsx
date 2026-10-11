"use client";

import { skillNameToIconPath, type Skill } from "@/data/portfolio";
import { useImageFallback } from "@/lib/useImageFallback";

// One skill: a square icon area with the name underneath. Deliberately inert
// -- no tooltip, no proficiency meter, no click action.
//
// The icon resolves from the skill name (see skillNameToIconPath). The 800x800
// source art carries a generous transparent margin of its own, so the square
// is sized up and the art is contained, never cropped. A missing file shows a
// clean square bearing the skill's initial, sized to roughly where the visible
// logo would sit inside that margin.
//
// The soft navy shadow is a drop-shadow filter rather than a box-shadow, so it
// follows the visible art's own (rounded) outline, not the padded square.
export function SkillTile({ skill }: { skill: Skill }) {
  const { failed, ref, onError } = useImageFallback();

  return (
    <li className="flex w-1/3 flex-col items-center gap-0.5 px-1 sm:w-28">
      <div className="flex aspect-square w-[72px] items-center justify-center drop-shadow-[3px_3px_3px_rgba(28,58,94,0.45)] sm:w-[88px] sm:drop-shadow-[4px_4px_4px_rgba(28,58,94,0.45)]">
        {failed ? (
          <span
            aria-hidden="true"
            className="flex aspect-square w-[70%] items-center justify-center border-2 border-ink-soft bg-wireframe-fill text-lg font-bold text-ink-soft sm:text-xl"
          >
            {skill.name.slice(0, 1).toUpperCase()}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={ref}
            src={skill.icon ?? skillNameToIconPath(skill.name)}
            alt=""
            draggable={false}
            decoding="async"
            className="h-full w-full object-contain"
            onError={onError}
          />
        )}
      </div>
      <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-ink-soft sm:text-xs">
        {skill.name}
      </span>
    </li>
  );
}
