// lib/syncDoctorsToAlgolia.ts
import algoliasearch from 'algoliasearch';
import { createClient } from '@sanity/client';
import { calculateAverageRating } from './ratingUtils';
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

const index = algoliaClient.initIndex('doctors_index');

export async function syncSingleDoctorToAlgolia(doctor: any) {
  const { averageRating, reviewCount } = calculateAverageRating(doctor.reviews || []);
  const slug = doctor.slug?.current || doctor._id;

  const record = {
    objectID: slug,
    _id: doctor._id,
    name: doctor.name,
    slug,
    photoUrl: doctor.photo?.asset?.url || '',
    photoId: doctor.photo?.asset?._id || '',
    specialty: doctor.specialty ? doctor.specialty.toLowerCase() : '', // Normalize to lowercase
    designation: doctor.designation || '',
    location: doctor.location || '',
    languages: doctor.languages || [],
    appointmentFee: doctor.appointmentFee || null,
    nextAvailableSlot: doctor.nextAvailableSlot || '',
    about: doctor.about || '',
    whatsappNumber: doctor.whatsappNumber || '',
    expertise: doctor.expertise || [],
    experienceYears: doctor.experienceYears || 0,
    searchKeywords: doctor.searchKeywords || [],
    bookingId: doctor.bookingId || '',
    externalApiId: doctor.externalApiId || '',
    averageRating: doctor.averageRating ?? averageRating,
    reviewCount,
    authoredArticles: doctor.authoredArticles || [],
    availability: doctor.availability || {},
  };

  console.log(`Syncing doctor ${slug} to Algolia...`);
  await index.saveObject(record);
  console.log(`✅ Synced doctor ${slug}`);
}

export async function deleteDoctorFromAlgolia(id: string) {
  console.log(`Deleting doctor ${id} from Algolia...`);
  await index.deleteObject(id);
  console.log(`✅ Deleted doctor ${id}`);
}

export async function syncDoctorsToAlgolia(data: {
  _id: string;
  _type: string;
  operation: 'create' | 'update' | 'delete';
  document: any;
}) {
  try {
    const { _id, operation } = data;

    if (operation === 'delete') {
      await deleteDoctorFromAlgolia(_id);
    } else {
      const doctor = await sanityClient.fetch(
        `*[_type == "doctor" && _id == $id][0]{
          _id, name, slug, photo{asset->{_id,url}}, specialty, designation, location,
          languages, appointmentFee, nextAvailableSlot, about, whatsappNumber, expertise,
          experienceYears, searchKeywords, bookingId, externalApiId,
          authoredArticles[]->{title, slug},
          "availability": *[_type == "availability" && references(^._id)][0]{monday, tuesday, wednesday, thursday, friday, saturday, sunday},
          "reviews": *[_type == "review" && references(^._id) && approved == true]{rating}
        }`,
        { id: _id }
      );

      if (!doctor) {
        console.warn(`Doctor ${_id} not found in Sanity`);
        return;
      }

      await syncSingleDoctorToAlgolia(doctor);
    }

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
  } catch (err) {
    console.error('❌ Doctor sync failed:', err);
    throw err;
  }
}

export async function fullSyncDoctorsToAlgolia() {
  const doctors = await sanityClient.fetch(`
    *[_type == "doctor"] | order(orderRank asc) {
      _id, name, slug, photo{asset->{_id,url}}, specialty, designation, location,
      languages, appointmentFee, nextAvailableSlot, about, whatsappNumber, expertise,
      experienceYears, searchKeywords, bookingId, externalApiId,
      authoredArticles[]->{title, slug},
      "availability": *[_type == "availability" && references(^._id)][0]{monday, tuesday, wednesday, thursday, friday, saturday, sunday},
      "reviews": *[_type == "review" && references(^._id) && approved == true]{rating}
    }
  `);

  const records = doctors.map((doc: any) => {
    const { averageRating, reviewCount } = calculateAverageRating(doc.reviews || []);
    const slug = doc.slug?.current || doc._id;

    return {
      objectID: slug,
      _id: doc._id,
      name: doc.name,
      slug,
      photoUrl: doc.photo?.asset?.url || '',
      photoId: doc.photo?.asset?._id || '',
      specialty: doc.specialty ? doc.specialty.toLowerCase() : '', // Normalize to lowercase
      designation: doc.designation || '',
      location: doc.location || '',
      languages: doc.languages || [],
      appointmentFee: doc.appointmentFee || null,
      nextAvailableSlot: doc.nextAvailableSlot || '',
      about: doc.about || '',
      whatsappNumber: doc.whatsappNumber || '',
      expertise: doc.expertise || [],
      experienceYears: doc.experienceYears || 0,
      searchKeywords: doc.searchKeywords || [],
      bookingId: doc.bookingId || '',
      externalApiId: doc.externalApiId || '',
      averageRating: doc.averageRating ?? averageRating,
      reviewCount,
      authoredArticles: doc.authoredArticles || [],
      availability: doc.availability || {},
    };
  });

  await index.saveObjects(records);
  console.log(`✅ Full sync: Synced ${records.length} doctors to Algolia`);
}