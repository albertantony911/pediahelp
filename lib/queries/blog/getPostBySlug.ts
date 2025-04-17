import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';

const query = groq`*[_type=="post" && slug.current==$slug][0]{
  _id, title, slug, excerpt, publishedAt,
  mainImage{asset->{url}},
  body,
  meta_title, meta_description, noindex,
  ogImage{asset->{url}},
  doctor->{
    _id, name, slug, photo{asset->{url}},
    specialty, expertise, experienceYears,
    whatsappNumber, appointmentFee,
    reviews[]->{_id,rating,comment,submittedAt}
  }
}`;

export function getPostBySlug(slug: string) {
  return client.fetch(query, { slug });
}