import { groq } from 'next-sanity';

export const heroSearchQuery = groq`
  _type == "heroSearch" => {
    _type,
    _key,
    tagLine,
    title,
    body,
    mediaType,
    riveFileUrl,
    showSearchBar,
    searchPlaceholder,
    image {
      ...,
      asset->{
        _id,
        url,
        metadata {
          lqip,
          dimensions {
            width,
            height
          }
        }
      },
      alt
    }
  }
`;