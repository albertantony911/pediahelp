import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const hero1Query = groq`
  _type == "hero-1" => {
    _type,
    _key,
    theme,
    layout,
    reverseOnMobile,
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
    showButton,
    buttonType,
    customButton {
      label,
      link,
      isExternal
    },
    riveAnimation{
      asset->{
        url
      }
    },
    stateMachines,
    defaultStateMachine,
    interactionInputs[] {
      inputName,
      inputType,
      event,
      value
    }
  }
`;