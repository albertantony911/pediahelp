import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import type { Doctor, PostWithDoctor } from '@/types';


const query = groq`{
  "doctor": *[_type=="doctor" && slug.current==$slug][0]{
    _id, name, slug, photo{asset->{url}}, specialty,
    expertise, experienceYears, whatsappNumber,
    appointmentFee, reviews[]->{_id,rating,comment,submittedAt}
  },
  "posts": *[_type=="post" && doctor._ref==*[_type=="doctor" && slug.current==$slug][0]._id]
            | order(publishedAt desc){
    _id, title, slug, excerpt, publishedAt,
    mainImage{asset->{url}}
  }
}`;

export function getDoctorWithPosts(
  slug: string
): Promise<{ doctor: Doctor | null; posts: PostWithDoctor[] }> {
  return client.fetch(query, { slug });
}