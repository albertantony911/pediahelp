import { groq } from 'next-sanity'
import { client } from '../lib/client'

// Define the type for the doctor data
interface Doctor {
  name: string;
  slug: { current: string };
  photo?: {
    asset?: {
      _id: string;
      url: string;
    };
  };
  specialty: string;
  designation: string;
  location: string;
  languages?: string[];
  appointmentFee: number;
  nextAvailableSlot: string;
  about: string;
  ratings?: number;
  reviews?: any[]; // Define a more specific type if you know the structure of reviews
  authoredArticles?: { title: string; slug: { current: string } }[];
  bookingId?: string;
  externalApiId?: string;
}


export async function getDoctorBySlug(slug: string): Promise<any | null> {
  return await client.fetch(
    groq`*[_type == "doctor" && slug.current == $slug][0]{
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
      ratings,
      reviews,
      authoredArticles[]->{ title, slug },
      bookingId,
      externalApiId,
      timezone,

      // ✅ NEW: pull appointment doc (reverse lookup) and expose weeklyAvailability
      "appointment": *[_type == "appointment" && references(^._id)][0]{
        weeklyAvailability
      }
    }`,
    { slug }
  );
}