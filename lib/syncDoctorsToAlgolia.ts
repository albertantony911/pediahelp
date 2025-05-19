import algoliasearch from 'algoliasearch';
import { createClient } from '@sanity/client';
import { calculateAverageRating } from './ratingUtils';
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
      slug,
      photo { asset->{ _id, url } },
      specialty,
      designation,
      location,
      languages,
      appointmentFee,
      nextAvailableSlot,
      about,
      whatsappNumber,
      expertise,
      experienceYears,
      searchKeywords,
      averageRating,
      bookingId,
      externalApiId,
      authoredArticles[]->{ title, slug },
      "availability": *[_type == "availability" && references(^._id)][0]{ 
        monday, tuesday, wednesday, thursday, friday, saturday, sunday
      },
      "reviews": *[_type == "review" && references(^._id) && approved == true]{ rating }
    }
  `);

  const records = doctors.map((doc: any) => {
    const { averageRating, reviewCount } = calculateAverageRating(doc.reviews || []);

    return {
      objectID: doc._id,
      name: doc.name,
      slug: doc.slug?.current,
      photoUrl: doc.photo?.asset?.url || '',
      photoId: doc.photo?.asset?._id || '',
      specialty: doc.specialty,
      designation: doc.designation,
      location: doc.location,
      languages: doc.languages || [],
      appointmentFee: doc.appointmentFee,
      nextAvailableSlot: doc.nextAvailableSlot || '',
      about: doc.about || '',
      whatsappNumber: doc.whatsappNumber || '',
      expertise: doc.expertise || [],
      experienceYears: doc.experienceYears || 0,
      searchKeywords: doc.searchKeywords || [],
      bookingId: doc.bookingId || '',
      externalApiId: doc.externalApiId || '',
      averageRating: doc.averageRating ?? averageRating,
      reviewCount: reviewCount,
      authoredArticles: doc.authoredArticles || [],
      availability: doc.availability || {},
    };
  });

  await index.saveObjects(records);

  await index.setSettings({
    searchableAttributes: [
      'unordered(name)',
      'unordered(specialty)',
      'unordered(designation)',
      'unordered(location)',
      'unordered(expertise)',
      'unordered(searchKeywords)',
      'unordered(languages)',
    ],
    attributesForFaceting: ['searchable(specialty)', 'searchable(languages)'],
    customRanking: ['desc(experienceYears)', 'desc(averageRating)', 'asc(appointmentFee)'],
    ranking: ['words', 'filters', 'typo', 'attribute', 'proximity', 'exact', 'custom'],
  });

  console.log(`✅ Synced ${records.length} doctors to Algolia`);
}