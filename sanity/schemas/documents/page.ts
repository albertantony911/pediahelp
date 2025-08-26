import { defineField, defineType } from "sanity";
import { Files } from "lucide-react";
import { orderRankField } from "@sanity/orderable-document-list";

// Organized insert menu groups
const insertMenuGroups = [
  { name: "hero", title: "Hero", of: ["hero-1", "hero-2"] },
  { name: "logo-cloud", title: "Logo Cloud", of: ["logo-cloud-1"] },
  { name: "section-header", title: "Section Header", of: ["section-header"] },
  { name: "grid", title: "Grid", of: ["grid-row"] },
  { name: "split", title: "Split", of: ["split-row"] },
  { name: "carousel", title: "Carousel", of: ["carousel-1", "carousel-2"] },
  { name: "timeline", title: "Timeline", of: ["timeline-row"] },
  { name: "cta", title: "CTA", of: ["cta-1"] },
  { name: "faqs", title: "FAQs", of: ["faqs"] },
  { name: "forms", title: "Forms", of: ["form-newsletter", "contact-form", "career-form"] },
  { name: "all-posts", title: "All Posts", of: ["all-posts"] },
  { name: "layout", title: "Layout", of: ["section-block"] },
  { name: "specialty", title: "Specialty", of: ["specialty-card"] },
  { name: "wave-divider", title: "Wave Divider", of: ["waveDivider"] },
];

// All block types
const blockTypes = [
  "hero-1",
  "hero-2",
  "section-header",
  "split-row",
  "grid-row",
  "carousel-1",
  "carousel-2",
  "timeline-row",
  "cta-1",
  "logo-cloud-1",
  "faqs",
  "form-newsletter",
  "contact-form",
  "career-form",
  "all-posts",
  "section-block",
  "specialty-card",
  "waveDivider",
];

export default defineType({
  name: "page",
  type: "document",
  title: "Page",
  icon: Files,
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
      name: "blocks",
      title: "Page Sections",
      type: "array",
      group: "content",
      of: blockTypes.map((type) => ({ type })),
      options: {
        insertMenu: {
          groups: insertMenuGroups,
          views: [
            {
              name: "grid",
              previewImageUrl: (block) => `/sanity/preview/${block}.jpg`,
            },
            { name: "list" },
          ],
        },
      },
    }),

    // SEO Fields
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

    // Orderable
    orderRankField({ type: "page" }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title,
        subtitle: 'Page',
      };
    },
  },
});