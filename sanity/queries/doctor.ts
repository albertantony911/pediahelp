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
      name,
      slug,
      photo {
        asset -> {
          _id,
          url
        }
      },
      specialty,
      designation,
      location,
      languages,
      appointmentFee,
      nextAvailableSlot,
      about,
      ratings,
      reviews,
      authoredArticles[]->{
        title,
        slug
      },
      bookingId,
      externalApiId,
      // 👇 Weekly Availability linked via reverse lookup
      "availability": *[_type == "availability" && references(^._id)][0]{
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday
      }
    }`,
    { slug }
  );
}