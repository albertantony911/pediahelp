import { groq } from 'next-sanity'

// @sanity-typegen-ignore
export const waveDividerQuery = groq`
  _type == "waveDivider" => {
    _type,
    _key,
    variant->{
      label,
      desktopSvg {
        asset->{
          _id,
          url,
          mimeType,
          metadata {
            dimensions {
              width,
              height
            }
          }
        }
      },
      mobileSvg {
        asset->{
          _id,
          url,
          mimeType,
          metadata {
            dimensions {
              width,
              height
            }
          }
        }
      }
    }
  }
`