import { groq } from 'next-sanity';

// @sanity-typegen-ignore
export const careerFormQuery = groq`
  _type == "career-form" => {
    _type,
    _key,
    theme,
    tagLine,
    title,
    successMessage
  }
`;