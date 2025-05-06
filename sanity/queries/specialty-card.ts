import { groq } from 'next-sanity';

// @sanity-typegen-ignore
export const specialtyCardQuery = groq`
  _type == "specialty-card" => {
    _type,
    _key,
    theme,
    tagLine,
    title,
    body,
    cards[] {
      name,
      image {
        alt,
        asset-> {
          _id,
          url,
          mimeType,
          metadata {
            lqip,
            dimensions {
              width,
              height
            }
          }
        }
      },
      link {
        internalLink-> {
          slug {
            current
          }
        },
        externalUrl
      },
      _key
    }
  }
`;