import { groq } from 'next-sanity';

export const heroSearch = groq`
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