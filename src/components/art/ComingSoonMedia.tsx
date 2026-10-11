// A plain, squarer face at normal weight, deliberately quieter than the
// site's rounded default -- this card is a placeholder, not a headline.
const COMING_SOON_FONT = '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';

// Media that isn't ready to be shown: a flat grey card reading "Coming Soon"
// in light grey, filling its (positioned) frame in place of the image and of
// the missing-file placeholder. Shared by the scene previews and the detail
// carousel, which differ only in text size.
export function ComingSoonMedia({ textClassName }: { textClassName: string }) {
  return (
    <div role="img" aria-label="Coming soon" className="absolute inset-0 flex items-center justify-center bg-[#858a93]">
      <span className={`font-normal tracking-[0.08em] text-[#d6d9de] ${textClassName}`} style={{ fontFamily: COMING_SOON_FONT }}>
        Coming Soon
      </span>
    </div>
  );
}
