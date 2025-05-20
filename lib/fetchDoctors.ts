import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import type { Doctor, Review } from '@/types';

export async function fetchAllDoctors(): Promise<Doctor[]> {
  const doctors = await client.fetch<Doctor[]>(
    groq`
      *[_type == "doctor"] | order(orderRank asc) {
        _id,
        name,
        specialty,
        experienceYears,
        photo { asset->{ _id, url } },
        slug,
        languages,
        appointmentFee,
        nextAvailableSlot,
        expertise,
        searchKeywords,
        whatsappNumber,
        qualifications {
          education,
          achievements,
          publications,
          others
        }
      }
    `
  );

  const withReviews = await Promise.all(
    doctors.map(async (doctor) => {
      const reviews = await client.fetch<Review[]>(
        groq`
          *[_type == "review" && doctor._ref == $id && approved == true] | order(submittedAt desc) {
            _id,
            name,
            rating,
            comment,
            submittedAt
          }
        `,
        { id: doctor._id }
      );

      return {
        ...doctor,
        reviews,
      };
    })
  );

  return withReviews;
}