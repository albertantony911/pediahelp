import { groq } from 'next-sanity'

// @sanity-typegen-ignore
export const sectionBlockQuery = groq`
  _type == "section-block" => {
    _type,
    _key,
    theme,
    layout,
    reverseOnMobile,
    tagLine,
    title,
    body,
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
    link {
      internalLink->{
        slug {
          current
        }
      },
      externalUrl
    },
    buttonVariant,
    topWaveDesktop,
    topWaveMobile
  }
`