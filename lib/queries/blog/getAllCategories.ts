import { groq } from 'next-sanity';

export const getAllCategoriesQuery = groq`
  *[_type == "category"] | order(orderRank) {
    _id,
    title
  }
`;