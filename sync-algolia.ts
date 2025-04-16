import algoliasearch from 'algoliasearch';
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

dotenv.config();

// --- Doctor data shape in Sanity ---
interface Doctor {
  name: string;
  specialty: string;
  slug: { current: string };
  photo?: { asset?: { url: string } };
  appointmentFee?: number;
  experienceYears?: number;
  expertise?: string[];
  searchKeywords?: string[];
  languages?: string[];
}

// --- Algolia index shape ---
interface DoctorAlgoliaRecord {
  objectID: string;
  name: string;
  specialty: string;
  slug: string;
  photoUrl: string;
  appointmentFee?: number;
  experienceYears?: number;
  languages: string[];
  keywords: string[];
}

// --- Setup Sanity client ---
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  apiVersion: '2023-10-01',
  useCdn: false,
});

// --- Setup Algolia client ---
const algoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.ALGOLIA_ADMIN_API_KEY || ''
);

// Initialize the index
const index = algoliaClient.initIndex('doctors_index');

/**
 * Fetches doctors from Sanity.
 * @returns {Promise<Doctor[]>} List of doctors.
 */
async function fetchDoctorsFromSanity(): Promise<Doctor[]> {
  console.log('⏳ Fetching doctors from Sanity...');
  return sanityClient.fetch(`
    *[_type == "doctor"] | order(orderRank asc) {
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
}

/**
 * Transforms a list of doctors from Sanity into Algolia records.
 * @param {Doctor[]} doctors - List of doctors from Sanity.
 * @returns {DoctorAlgoliaRecord[]} List of Algolia records.
 */
function transformDoctorsToAlgoliaRecords(doctors: Doctor[]): DoctorAlgoliaRecord[] {
  return doctors.map((doc) => ({
    objectID: doc.slug.current,
    name: doc.name,
    specialty: doc.specialty,
    slug: doc.slug.current,
    photoUrl: doc.photo?.asset?.url ?? '',
    appointmentFee: doc.appointmentFee,
    experienceYears: doc.experienceYears,
    languages: doc.languages ?? [],
    keywords: [
      ...(doc.expertise ?? []),
      ...(doc.searchKeywords ?? []),
      ...(doc.specialty ? [doc.specialty] : []),
      ...(doc.languages ?? []),
    ],
  }));
}

/**
 * Syncs doctors to Algolia.
 */
async function syncDoctorsToAlgolia(): Promise<void> {
  try {
    const doctors = await fetchDoctorsFromSanity();
    console.log(`✅ Retrieved ${doctors.length} doctors.`);

    const records = transformDoctorsToAlgoliaRecords(doctors);

    console.log('🚀 Syncing to Algolia...');
    await index.saveObjects(records);
    console.log('✅ Doctors successfully synced to Algolia!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Execute the sync process
syncDoctorsToAlgolia();