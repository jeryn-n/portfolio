"use client";

import { useState } from "react";
import type { Skill } from "@/data/portfolio";

// One skill: a square icon area with the name underneath. Deliberately inert
// -- no tooltip, no proficiency meter, no click action.
//
// Real icon art hasn't been made, and none is invented here: a skill with no
// `icon` (or one whose file 404s) shows a clean square bearing the skill's
// initial, in the same bounds the real icon will occupy.
export function SkillTile({ skill }: { skill: Skill }) {
  const [failed, setFailed] = useState(false);
  const showIcon = Boolean(skill.icon) && !failed;

  return (
    <li className="flex w-1/3 flex-col items-center gap-1.5 px-1 sm:w-24">
      <div className="flex aspect-square w-12 items-center justify-center overflow-hidden border-2 border-ink-soft bg-wireframe-fill sm:w-14">
        {showIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={skill.icon}
            alt=""
            draggable={false}
            decoding="async"
            className="h-full w-full object-contain"
            style={{ imageRendering: "pixelated" }}
            onError={() => setFailed(true)}
          />
        ) : (
          <span aria-hidden="true" className="text-base font-bold text-ink-soft sm:text-lg">
            {skill.name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-ink-soft sm:text-[11px]">
        {skill.name}
      </span>
    </li>
  );
}
