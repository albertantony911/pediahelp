import { defineField, defineType } from "sanity";
import { LayoutTemplate } from "lucide-react";

export default defineType({
  name: "hero-2",
  title: "Hero 2",
  type: "object",
  icon: LayoutTemplate,
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
    }),
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "body",
      type: "block-content",
    }),
    defineField({
      name: "buttons",
      title: "Buttons",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "buttonLabel",
              title: "Button Label",
              type: "string",
              description: "Label for the button. Leave empty to hide the button.",
            }),
            defineField({
              name: "link",
              title: "Button Link",
              type: "object",
              description: "Choose an internal page or provide an external URL.",
              fields: [
                defineField({
                  name: "internalLink",
                  title: "Internal Link",
                  type: "reference",
                  to: [{ type: "page" }],
                  description: "Select an internal page for the button.",
                }),
                defineField({
                  name: "externalUrl",
                  title: "External URL",
                  type: "url",
                  description: "Provide an external URL (e.g., https://example.com).",
                }),
              ],
              validation: (Rule) =>
                Rule.custom((fields) => {
                  if (fields?.internalLink && fields?.externalUrl) {
                    return "Choose either an internal link or an external URL, not both.";
                  }
                  return true;
                }),
            }),
            defineField({
              name: "buttonVariant",
              title: "Button Variant",
              type: "string",
              options: {
                list: [
                  { title: "Default", value: "default" },
                  { title: "Secondary", value: "secondary" },
                  { title: "Ghost", value: "ghost" },
                  { title: "Outline", value: "outline" },
                  { title: "Destructive", value: "destructive" },
                  { title: "Link", value: "link" },
                  { title: "WhatsApp", value: "whatsapp" },
                ],
              },
            }),
          ],
          preview: {
            select: {
              label: "buttonLabel",
            },
            prepare({ label }) {
              return {
                title: label || "Button",
              };
            },
          },
        },
      ],
      validation: (rule) => rule.max(2),
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Hero 2",
        subtitle: title,
      };
    },
  },
});