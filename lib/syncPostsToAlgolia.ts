import algoliasearch from 'algoliasearch';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  apiVersion: '2023-10-01',
  useCdn: false,
});

const algoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!
);

const index = algoliaClient.initIndex('blog_posts_index');

export async function syncPostsToAlgolia() {
  const posts = await sanityClient.fetch(`
    *[_type == "post"]{
      _id,
      title,
      slug { current },
      excerpt,
      publishedAt,
      image { asset->{ url } },
      doctor->{ name, photo { asset->{ url } }, slug },
      categories[]->{ _id, title }
    }
  `);

  const records = posts.map((post: any) => ({
    objectID: post.slug.current,
    title: post.title,
    slug: post.slug.current,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    imageUrl: post.image?.asset?.url ?? '',
    doctorName: post.doctor?.name ?? '',
    doctorPhotoUrl: post.doctor?.photo?.asset?.url ?? '',
    categoryTitles: post.categories?.map((c: any) => c.title) ?? [],
    categoryIds: post.categories?.map((c: any) => c._id) ?? [],
  }));

  await index.saveObjects(records);
}