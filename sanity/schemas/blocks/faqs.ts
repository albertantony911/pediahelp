import { defineType, defineField } from "sanity";
import { ListCollapse } from "lucide-react";

export default defineType({
  name: "faqs",
  type: "object",
  icon: ListCollapse,
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
      name: "faqs",
      type: "array",
      title: "FAQs",
      of: [
        {
          name: "faq",
          type: "reference",
          to: [{ type: "faq" }],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "faqs.0.title",
    },
    prepare({ title }) {
      return {
        title: "FAQs",
        subtitle: title || "No Title",
      };
    },
  },
});