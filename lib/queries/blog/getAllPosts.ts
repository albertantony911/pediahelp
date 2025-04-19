// /lib/queries/blog/getAllPosts.ts
import { groq } from 'next-sanity';

export const getAllPostsQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    "image": image.asset->{url},
    doctor->{
      name,
      "slug": slug.current,
      specialty,
      photo { asset->{url} }
    }
  }
`;