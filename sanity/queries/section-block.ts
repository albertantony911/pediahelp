import { groq } from 'next-sanity'

// @sanity-typegen-ignore
export const sectionBlockQuery = groq`
  _type == "section-block" => {
    _type,
    _key,
    theme,
    layout,
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
    image {
      ...,
      alt,
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
    },
    buttonLabel,
    href,
    buttonVariant
  }
`