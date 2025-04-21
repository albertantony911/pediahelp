import { defineField, defineType } from "sanity";
import { orderRankField } from "@sanity/orderable-document-list";
import { BookA } from "lucide-react";

export default defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: BookA,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({ type: "category" }),
  ],
});

import { groq } from "next-sanity";

export const getAllCategoriesQuery = groq`
  *[_type == "category"] | order(orderRank) {
    _id,
    title,
    slug
  }
`;