import { defineField, defineType } from "sanity";
import { FileText } from "lucide-react";

export default defineType({
  name: "post",
  title: "Post",
  type: "document",
  icon: FileText,
  groups: [
    { name: "content", title: "Content" },
    { name: "seo", title: "SEO" },
    { name: "settings", title: "Settings" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      group: "content",
    }),

    // ✅ Doctor Author Reference
    defineField({
      name: "doctorAuthor",
      title: "Written by (Doctor)",
      type: "reference",
      to: [{ type: "doctor" }],
      group: "settings",
      description: "Select the doctor who authored this blog post. Their profile will appear at the end of the post.",
    }),

    defineField({
      name: "image",
      title: "Image",
      type: "image",
      group: "settings",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      group: "settings",
      of: [{ type: "reference", to: { type: "category" } }],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "block-content",
      group: "content",
    }),
    defineField({
      name: "meta_title",
      title: "Meta Title",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "meta_description",
      title: "Meta Description",
      type: "text",
      group: "seo",
    }),
    defineField({
      name: "noindex",
      title: "No Index",
      type: "boolean",
      initialValue: false,
      group: "seo",
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph Image - [1200x630]",
      type: "image",
      group: "seo",
    }),
  ],

  preview: {
    select: {
      title: "title",
      doctor: "doctorAuthor.name",
      media: "image",
    },
    prepare(selection) {
      const { doctor } = selection;
      return {
        ...selection,
        subtitle: doctor ? `by Dr. ${doctor}` : "No author selected",
      };
    },
  },
});