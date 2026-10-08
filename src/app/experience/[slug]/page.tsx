import { notFound } from "next/navigation";
import { PortfolioDetailPage } from "@/components/detail/PortfolioDetailPage";
import { EXPERIENCE_ENTRIES, getCategoryEntry } from "@/data/portfolio";

// The dataset is local and static, so every experience route is prerendered.
export function generateStaticParams() {
  return EXPERIENCE_ENTRIES.map((entry) => ({ slug: entry.slug }));
}

// See the projects route for why `dynamicParams` is not set here.

export async function generateMetadata({ params }: PageProps<"/experience/[slug]">) {
  const { slug } = await params;
  const entry = getCategoryEntry("experience", slug);
  return { title: entry ? `${entry.title} — imjeryn` : "Not found — imjeryn" };
}

// Mirrors the projects route exactly -- same validation, same shared client
// template, only the category differs. There is no second detail-page
// implementation.
export default async function ExperienceDetailRoute({ params }: PageProps<"/experience/[slug]">) {
  const { slug } = await params;
  const entry = getCategoryEntry("experience", slug);
  if (!entry) notFound();

  return <PortfolioDetailPage key={entry.slug} entry={entry} />;
}
