import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import type { Doctor, Review } from '@/types';

export type DoctorWithReviews = {
  doctor: Doctor;
  reviews: Review[];
};

const query = groq`*[_type == "doctor"] | order(orderRank asc) {
  "doctor": {
    _id, name, specialty, experienceYears,
    photo { asset->{ _id, url } },
    slug, languages, appointmentFee, nextAvailableSlot,
    expertise, searchKeywords, whatsappNumber,
    qualifications
  },
  "reviews": *[_type == "review" && doctor._ref == ^._id && approved == true]
              | order(submittedAt desc){
    _id, name, rating, comment, submittedAt
  }
}`;

export function getDoctorsWithReviews(): Promise<DoctorWithReviews[]> {
  return client.fetch(query);
}