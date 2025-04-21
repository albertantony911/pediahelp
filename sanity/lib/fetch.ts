import { sanityFetch } from "@/sanity/lib/live";

// ---------------- Queries ----------------
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import {
  POST_QUERY,
  POSTS_QUERY,
  POSTS_SLUGS_QUERY,
} from "@/sanity/queries/post";
import { getAllCategoriesQuery } from "@/sanity/queries/category";

// ---------------- Types ----------------
import type {
  PAGE_QUERYResult,
  PAGES_SLUGS_QUERYResult,
  POST_QUERYResult,
  POSTS_QUERYResult,
  POSTS_SLUGS_QUERYResult,
} from "@/sanity.types";
import type { Category } from "@/types";

// ---------------- Page Queries ----------------
export const fetchSanityPageBySlug = async ({
  slug,
}: {
  slug: string;
}): Promise<PAGE_QUERYResult> => {
  const { data } = await sanityFetch({
    query: PAGE_QUERY,
    params: { slug },
  });

  return data;
};

export const fetchSanityPagesStaticParams =
  async (): Promise<PAGES_SLUGS_QUERYResult> => {
    const { data } = await sanityFetch({
      query: PAGES_SLUGS_QUERY,
      perspective: "published",
      stega: false,
    });

    return data;
  };

// ---------------- Blog Post Queries ----------------
export const fetchSanityPosts = async (): Promise<POSTS_QUERYResult> => {
  const { data } = await sanityFetch({
    query: POSTS_QUERY,
  });

  return data;
};

export const fetchSanityPostBySlug = async ({
  slug,
}: {
  slug: string;
}): Promise<POST_QUERYResult> => {
  const { data } = await sanityFetch({
    query: POST_QUERY,
    params: { slug },
  });

  return data;
};

export const fetchSanityPostsStaticParams =
  async (): Promise<POSTS_SLUGS_QUERYResult> => {
    const { data } = await sanityFetch({
      query: POSTS_SLUGS_QUERY,
      perspective: "published",
      stega: false,
    });

    return data;
  };

// ---------------- Category Queries ----------------
export const fetchSanityCategories = async (): Promise<Category[]> => {
  const { data } = await sanityFetch({
    query: getAllCategoriesQuery,
    perspective: "published",
  });

  return data;
};

import { BLOG_PREVIEW_QUERY } from "@/sanity/queries/post";
import type { BlogPreview } from "@/types"; // you'll create this in a sec

export const fetchSanityBlogPreviews = async (): Promise<BlogPreview[]> => {
  const { data } = await sanityFetch({
    query: BLOG_PREVIEW_QUERY,
    perspective: "published",
  });

  return data;
};