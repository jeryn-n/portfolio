import { notFound } from "next/navigation";
import { PortfolioDetailPage } from "@/components/detail/PortfolioDetailPage";
import { PROJECT_ENTRIES, getCategoryEntry } from "@/data/portfolio";
import { PROJECTS_UNDER_CONSTRUCTION } from "@/data/site";

// The dataset is local and static, so every project route is prerendered.
export function generateStaticParams() {
  return PROJECT_ENTRIES.map((entry) => ({ slug: entry.slug }));
}

// NOTE: `export const dynamicParams = false` would be the natural way to
// make an unlisted slug a route-level 404, but it is rejected outright under
// this project's `cacheComponents` config. Unknown slugs therefore stream
// through notFound() below and render Next's not-found page, which is
// correct content served under a 200 shell status -- a property of partial
// prerendering, not of this route.

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const entry = PROJECTS_UNDER_CONSTRUCTION ? undefined : getCategoryEntry("project", slug);
  return { title: entry ? `${entry.title} — imjeryn` : "Not found — imjeryn" };
}

// Server Component wrapper: resolves and validates the slug, then hands the
// static entry to the shared interactive client template. The lookup is
// category-scoped, so an experience slug under /projects (or any unknown
// slug) falls through to Next's not-found path instead of rendering.
//
// The slug key guarantees a fresh mount when Previous/Next Entry moves
// between sibling routes, which is what resets the carousel to the overview.
//
// While Projects is under construction, every project route is not-found.
export default async function ProjectDetailRoute({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const entry = PROJECTS_UNDER_CONSTRUCTION ? undefined : getCategoryEntry("project", slug);
  if (!entry) notFound();

  return <PortfolioDetailPage key={entry.slug} entry={entry} />;
}
