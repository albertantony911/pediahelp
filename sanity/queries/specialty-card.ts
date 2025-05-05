import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const specialtyCardQuery = groq`
  _type == "specialty-card" => {
    _type,
    _key,
    theme,
    tagLine,
    title,
    body[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
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
      }
    },
    cards[]{
      name,
      image{
        ...,
        asset->{
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
        },
        alt
      },
      link,
    },
  }
`;