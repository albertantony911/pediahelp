import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const hero2Query = groq`
  _type == "hero-2" => {
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
    buttons[]{
      buttonLabel,
      buttonType,
      link {
        internalLink->{
          slug {
            current
          }
        },
        externalUrl
      },
      buttonVariant,
      whatsappPhone,
      whatsappMessage
    }
  }
`;