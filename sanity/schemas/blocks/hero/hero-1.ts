import { defineField, defineType } from "sanity";
import { LayoutTemplate } from "lucide-react";

export default defineType({
  name: "hero-1",
  title: "Hero 1",
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
      name: "image",
      title: "Image",
      type: "image",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "showButton",
      title: "Show Button",
      type: "boolean",
      description: "Enable to display a button in the hero section.",
      initialValue: true,
    }),
    defineField({
      name: "buttonType",
      title: "Button Type",
      type: "string",
      options: {
        list: [
          { title: "Primary CTA (Book Appointment)", value: "primaryCTA" },
          { title: "Custom Button", value: "custom" },
        ],
      },
      hidden: ({ parent }) => !parent?.showButton,
      initialValue: "primaryCTA",
    }),
    defineField({
      name: "customButton",
      title: "Custom Button",
      type: "object",
      hidden: ({ parent }) => !parent?.showButton || parent?.buttonType !== "custom",
      fields: [
        defineField({
          name: "label",
          title: "Button Label",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "link",
          title: "Link",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "isExternal",
          title: "External Link",
          type: "boolean",
          description: "Enable if the link points to an external website.",
          initialValue: false,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Hero 1",
        subtitle: title,
      };
    },
  },
});