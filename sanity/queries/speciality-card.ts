import { groq } from 'next-sanity';

// @sanity-typegen-ignore
export const specialityCardQuery = groq`
  _type == "speciality-card" => {
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
          asset->{
            _id,
            url,
            mimeType,
            metadata {
              lqip,
              dimensions { width, height }
            }
          },
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