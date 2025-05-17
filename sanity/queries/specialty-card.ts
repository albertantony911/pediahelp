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
    cardsSet-> {
      cards[] {
        _key,
        name,
        image {
          asset->{ _id, url, mimeType, metadata { lqip, dimensions } },
          alt
        },
        link {
          hasLink,
          linkType,
          internalLink->{ _type, slug { current } },
          externalUrl
        }
      }
    }
  }
`;