import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, useCdn } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Must be false for mutations
  perspective: "published",
  token: process.env.SANITY_API_TOKEN, // Editor role token
  stega: {
    studioUrl: process.env.NEXT_PUBLIC_SITE_URL + "/studio",
  },
});