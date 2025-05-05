import { groq } from 'next-sanity';

export const contactFormQuery = groq`
  _type == "contact-form" => {
    _type,
    _key,
    theme,
    tagLine,
    title,
    description[] {
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url,
          mimeType,
          metadata {
            lqip,
            dimensions { width, height }
          }
        }
      }
    }
  }
`;