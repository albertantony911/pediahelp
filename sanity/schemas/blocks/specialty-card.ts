import { defineField, defineType } from "sanity";
import { LayoutGrid } from "lucide-react";

export default defineType({
  name: "specialty-card",
  title: "Specialty Card Block",
  type: "object",
  icon: LayoutGrid,
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
    defineField({
      name: "cards",
      type: "array",
      title: "Specialty Cards",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "name",
              type: "string",
              title: "Specialty Name",
              description: "Name of the specialty (hidden visually, used for SEO and screen readers)",
            }),
            defineField({
              name: "image",
              type: "image",
              title: "Specialty Image",
              description: "Square image representing the specialty",
              fields: [
                {
                  name: "alt",
                  type: "string",
                  title: "Alternative Text",
                  description: "Alt text for accessibility and SEO (hidden visually)",
                },
              ],
            }),
            defineField({
              name: "link",
              type: "url",
              title: "Link",
              description: "URL to the specialty page",
            }),
          ],
          preview: {
            select: {
              title: "name",
              media: "image",
            },
            prepare({ title, media }) {
              return {
                title: title || "Specialty Card",
                subtitle: title || "No name",
                media,
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Specialty Card Block",
        subtitle: title || "No title",
      };
    },
  },
});