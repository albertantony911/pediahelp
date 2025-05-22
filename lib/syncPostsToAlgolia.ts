import algoliasearch from 'algoliasearch';
import { createClient } from '@sanity/client';
import 'dotenv/config';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  apiVersion: '2023-10-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
});

const algoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!
);

const index = algoliaClient.initIndex('blog_posts_index');

interface PostWebhookData {
  _id: string;
  _type: string;
  operation: 'create' | 'update' | 'delete';
  document: any;
}

// 🧠 Utility to flatten portable text blocks
function flattenBody(blocks: any[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((block) => block._type === 'block' && Array.isArray(block.children))
    .map((block) =>
      block.children.map((child: any) => child.text || '').join('')
    )
    .join('\n')
    .slice(0, 2000); // Optional: truncate long posts
}

async function syncSinglePostToAlgolia(post: any) {
  const objectID = post._id;

  const record = {
    objectID,
    _id: post._id,
    title: post.title ?? '',
    slug: post.slug ?? null, // Store as object { current: string } or null
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
    content: flattenBody(post.body ?? []),
  };

  console.log(`Syncing post ${objectID} to Algolia...`);
  await index.saveObject(record);
  console.log(`✅ Post ${objectID} synced to Algolia`);
}

async function deletePostFromAlgolia(postId: string) {
  console.log(`Deleting post ${postId} from Algolia...`);
  await index.deleteObject(postId);
  console.log(`✅ Post ${postId} deleted from Algolia`);
}

export async function syncPostsToAlgolia(data: PostWebhookData) {
  try {
    const { operation, document } = data;

    if (operation === 'delete') {
      await deletePostFromAlgolia(document._id);
    } else if (operation === 'create' || operation === 'update') {
      const post = await sanityClient.fetch(
        `
        *[_type == "post" && _id == $id][0] {
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
          categories[]->{ _id, title },
          body[] // include content blocks
        }
        `,
        { id: document._id }
      );

      if (!post) {
        console.warn(`Post ${document._id} not found in Sanity, skipping sync.`);
        return;
      }

      await syncSinglePostToAlgolia(post);
    }

    // Update index settings (safe to run multiple times)
    await index.setSettings({
      searchableAttributes: [
        'unordered(title)',
        'unordered(excerpt)',
        'unordered(categoryTitles)',
        'unordered(doctorAuthor.name)',
        'unordered(doctorAuthor.specialty)',
        'unordered(content)', // ← content has lowest priority
      ],
      attributesForFaceting: ['searchable(categoryIds)'],
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
  } catch (error) {
    console.error('❌ Error syncing to Algolia:', error);
    throw error;
  }
}

export async function fullSyncPostsToAlgolia() {
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
      categories[]->{ _id, title },
      body[]
    }
  `);

  const records = posts.map((post: any) => {
    const objectID = post._id || post.slug?.current || crypto.randomUUID();

    return {
      objectID,
      _id: post._id,
      title: post.title ?? '',
      slug: post.slug ?? null, // Store as object { current: string } or null
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
      content: flattenBody(post.body ?? []),
    };
  });

  await index.saveObjects(records);
  console.log(`✅ Full sync: Synced ${records.length} blog posts to Algolia`);
}