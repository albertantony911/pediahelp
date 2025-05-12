import { groq } from 'next-sanity';

export const BLOG_LANDING_QUERY = groq`
{
  "categories": *[_type == "category"] | order(title asc) {
    _id,
    title
  },
  "posts": *[_type == "post" && count(categories) > 0] | order(_createdAt desc) {
    _id,
    title,
    slug {
      current
    },
    excerpt,
    image {
      asset-> {
        url
      },
      alt
    },
    "categoryIds": categories[]->_id
  }
}
`;