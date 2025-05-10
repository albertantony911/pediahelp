import Blocks from "@/components/blocks";
import { notFound } from "next/navigation";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import {
  fetchSanitySpecialitiesBySlug,
  fetchSanitySpecialitiesStaticParams,
} from "@/sanity/lib/fetch";
import type { SPECIALITIES_PAGE_QUERYResult } from "@/sanity.types";

// Static Params
export async function generateStaticParams() {
  const pages = await fetchSanitySpecialitiesStaticParams();
  return pages.map((page) => ({
    slug: page.slug?.current,
  }));
}

// Metadata
export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = await paramsPromise; // Await the params Promise
  const page = await fetchSanitySpecialitiesBySlug({ slug: params.slug });

  if (!page) {
    notFound();
  }

  return generatePageMetadata({ page, slug: params.slug });
}

// Page Component
export default async function SpecialitiesPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = await paramsPromise; // Await the params Promise
  const page = await fetchSanitySpecialitiesBySlug({ slug: params.slug });

  if (!page) {
    notFound();
  }

  return <Blocks blocks={page.blocks ?? []} />;
}