import algoliasearch from 'algoliasearch';
import { createClient } from '@sanity/client';
import 'dotenv/config';

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
    *[_type == "post" && defined(slug.current) && defined(image.asset)] | order(_createdAt desc) {
      _id,
      title,
      slug { current },
      excerpt,
      image {
        asset->{
          _id,
          url,
          mimeType,
          metadata { lqip, dimensions { width, height } }
        },
        alt
      },
      doctorAuthor->{
        name,
        specialty
      },
      categories[]->{ _id, title }
    }
  `);

  const records = posts.map((post: any) => {
    const objectID = post._id || post.slug?.current || crypto.randomUUID();

    return {
      objectID,
      _id: post._id,
      title: post.title ?? '',
      slug: post.slug?.current ?? '',
      excerpt: post.excerpt ?? null,
      imageUrl: post.image?.asset?.url ?? null,
      imageAlt: post.image?.alt ?? post.title ?? 'Blog image',
      doctorAuthor: post.doctorAuthor
        ? {
            name: post.doctorAuthor.name ?? '',
            specialty: post.doctorAuthor.specialty ?? '',
          }
        : null,
      categoryTitles: post.categories?.map((c: any) => c.title) ?? [],
      categoryIds: post.categories?.map((c: any) => c._id) ?? [],
    };
  });

  await index.saveObjects(records);

  await index.setSettings({
    searchableAttributes: [
      'unordered(title)',
      'unordered(excerpt)',
      'unordered(categoryTitles)',
      'unordered(doctorAuthor.name)',
      'unordered(doctorAuthor.specialty)',
    ],
    attributesForFaceting: ['searchable(categoryIds)'],
    customRanking: ['desc(_createdAt)'],
    ranking: [
      'words',
      'filters',
      'typo',
      'attribute',
      'proximity',
      'exact',
      'custom',
    ],
  });

  console.log(`✅ Synced ${records.length} blog posts to Algolia`);
}