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

const index = algoliaClient.initIndex('doctors_index');

export async function syncDoctorsToAlgolia() {
  const doctors = await sanityClient.fetch(`
    *[_type == "doctor"] | order(orderRank asc) {
      _id,
      name,
      specialty,
      slug { current },
      photo { asset->{ url } },
      appointmentFee,
      experienceYears,
      expertise,
      searchKeywords,
      languages
    }
  `);

  const records = doctors.map((doc: any) => ({
    objectID: doc.slug.current,
    name: doc.name,
    slug: doc.slug.current,
    specialty: doc.specialty,
    photoUrl: doc.photo?.asset?.url ?? '',
    appointmentFee: doc.appointmentFee,
    experienceYears: doc.experienceYears,
    languages: doc.languages ?? [],
    expertise: doc.expertise ?? [],
    searchKeywords: doc.searchKeywords ?? [],
  }));

  await index.saveObjects(records);

  await index.setSettings({
    searchableAttributes: [
      'unordered(name)',
      'unordered(specialty)',
      'unordered(expertise)',
      'unordered(searchKeywords)',
      'unordered(languages)',
    ],
    attributesForFaceting: ['searchable(specialty)', 'searchable(languages)'],
    customRanking: ['desc(experienceYears)', 'asc(appointmentFee)'],
    ranking: ['words', 'filters', 'typo', 'attribute', 'proximity', 'exact', 'custom'],
  });
}