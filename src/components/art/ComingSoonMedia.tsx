// A plain, squarer face at normal weight, deliberately quieter than the
// site's rounded default -- this card is a placeholder, not a headline.
const COMING_SOON_FONT = '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';

// Media that isn't ready to be shown, reading "Coming Soon" in light grey.
// Fills its (positioned) frame in one of two ways:
// - card: flat grey, in place of the image and its missing-file placeholder;
// - overlay: a delicate translucent grey veil over the real image beneath.
// Shared by the scene previews and the detail carousel, which differ only in
// text size.
export function ComingSoonMedia({ textClassName, overlay = false }: { textClassName: string; overlay?: boolean }) {
  return (
    <div
      role="img"
      aria-label="Coming soon"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${
        overlay ? "bg-[#858a93]/45" : "bg-[#858a93]"
      }`}
    >
      <span
        className={`font-normal tracking-[0.08em] ${
          overlay ? "text-[#eef0f3] [text-shadow:0_1px_4px_rgba(30,34,40,0.55)]" : "text-[#d6d9de]"
        } ${textClassName}`}
        style={{ fontFamily: COMING_SOON_FONT }}
      >
        Coming Soon
      </span>
    </div>
  );
}
