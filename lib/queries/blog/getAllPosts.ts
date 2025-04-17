// /lib/queries/blog/getAllPosts.ts
import { groq } from 'next-sanity';

export const getAllPostsQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    image { asset->{url} },
    doctor->{
      name,
      slug,
      specialty,
      photo { asset->{url} }
    }
  }
`;