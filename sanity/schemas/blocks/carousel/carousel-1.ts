import { defineField, defineType } from "sanity";
import { GalleryHorizontal } from "lucide-react";

export default defineType({
  name: "carousel-1",
  type: "object",
  title: "Carousel 1",
  icon: GalleryHorizontal,
  description: "A carousel of blog posts",
  fields: [
    defineField({
      name: "theme",
      title: "Theme Variant",
      type: "string",
      options: {
        list: [
          { title: "Dark Shade", value: "dark-shade" },
          { title: "Mid Shade", value: "mid-shade" },
          { title: "Light Shade", value: "light-shade" },
          { title: "White", value: "white" },
        ],
      },
    }),
    defineField({
      name: "tagLine",
      type: "string",
      title: "Tagline (Optional)",
    }),
    defineField({
      name: "title",
      type: "string",
      title: "Title (Optional)",
    }),
    defineField({
      name: "body",
      type: "block-content",
      title: "Body (Optional)",
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Blog Post Carousel",
        subtitle: title || "No title",
      };
    },
  },
});