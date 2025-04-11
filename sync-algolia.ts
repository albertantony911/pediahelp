import { algoliasearch } from 'algoliasearch';
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Define the Doctor interface
interface Doctor {
  name: string;
  specialty: string;
  photo?: { asset?: { url: string } };
  slug: { current: string };
  languages?: string[];
  appointmentFee?: number;
  nextAvailableSlot?: string;
  expertise?: string[];
  experience?: string;
  _id?: string; // Optional Sanity ID
  _type?: string; // Optional Sanity type
}

// Define a minimal interface for the Algolia index
interface AlgoliaIndex {
  saveObjects(objects: any[]): Promise<void>;
}

// Assert the Algolia client type to include initIndex
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'lez7cr3f',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2023-10-01',
  useCdn: false,
});

const algoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  process.env.ALGOLIA_ADMIN_API_KEY || ''
) as any; // Temporary type assertion to avoid strict typing issues
const index = algoliaClient.initIndex('doctors_index') as AlgoliaIndex;

async function syncData() {
  try {
    const doctors: Doctor[] = await sanityClient.fetch(
      `*[_type == "doctor"] | order(orderRank asc) {
        name,
        specialty,
        photo { asset->{url} },
        slug { current },
        languages,
        appointmentFee,
        nextAvailableSlot,
        expertise,
        experience
      }`
    );

    const objectsToIndex = doctors.map((doctor) => ({
      objectID: doctor.slug.current, // Unique ID for Algolia
      ...doctor,
    }));

    await index.saveObjects(objectsToIndex);
    console.log('Data synced to Algolia successfully!');
  } catch (error) {
    console.error('Error syncing data to Algolia:', error);
  }
}

syncData();