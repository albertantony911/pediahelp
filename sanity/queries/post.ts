import { groq } from "next-sanity";

export const POST_QUERY = groq`*[_type == "post" && slug.current == $slug][0]{
  title,
  slug,
  image {
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
  body[] {
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
  categories[]->{
    _id,
    title,
    slug
  },
  doctorAuthor-> {
    _id,
    name,
    slug,
    photo {
      asset->{
        _id,
        url,
        mimeType,
        metadata {
          lqip,
          dimensions { width, height }
        }
      }
    },
    specialty,
    experienceYears,
    expertise,
    whatsappNumber,
    appointmentFee,
    reviews[]->{
      _id,
      name,
      rating,
      comment,
      submittedAt
    }
  },
  _createdAt,
  _updatedAt,
  meta_title,
  meta_description,
  noindex,
  ogImage {
    asset->{
      _id,
      url,
      metadata {
        dimensions {
          width,
          height
        }
      }
    }
  }
}`;

export const POSTS_QUERY = groq`*[_type == "post" && defined(slug.current)] | order(_createdAt desc) {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  image {
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
  doctorAuthor-> {
    _id,
    name,
    slug,
    specialty,
    photo {
      asset->{ url }
    }
  }
}`;

export const POSTS_SLUGS_QUERY = groq`*[_type == "post" && defined(slug.current)]{
  slug
}`;


export const BLOG_PREVIEW_QUERY = groq`
*[_type == "category"]{
  _id,
  title,
  "posts": *[
    _type == "post" &&
    references(^._id)
  ] | order(_createdAt desc)[0...3] {
    _id,
    title,
    slug,
    excerpt,
    image {
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
    }
  }
}
`;