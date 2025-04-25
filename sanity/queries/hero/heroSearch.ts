export const heroSearch = `_type == "heroSearch" => {
  _type,
  _key,
  tagLine,
  title,
  body,
  mediaType,
  riveFileUrl,
  searchPlaceholder,
  image {
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
}`;