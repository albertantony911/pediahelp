// in getPostBySlug.ts
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import { PostWithDoctor } from '@/types'; // if you have this type


const query = groq`*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  mainImage { asset->{ url } },
  body,
  categories[]->{ title, slug },
  meta_title,
  meta_description,
  noindex,
  ogImage { asset->{ url } },
  doctor->{
    _id,
    name,
    slug,
    photo { asset->{ url } },
    specialty,
    expertise,
    experienceYears,
    whatsappNumber,
    appointmentFee,
    reviews[] { _id, name, rating, comment, submittedAt }
  }
}`;

export async function getPostBySlug(slug: string): Promise<PostWithDoctor | null> {
  return client.fetch(query, { slug });
}