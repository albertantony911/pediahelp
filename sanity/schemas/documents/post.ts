import { defineField, defineType } from 'sanity';
import { FileText } from 'lucide-react';

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  icon: FileText,
  groups: [
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
    { name: 'settings', title: 'Settings' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'settings',
      options: { source: 'title', maxLength: 96 },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: 'Content',
      type: 'blockContent',
      group: 'content',
    }),
    defineField({
      name: 'doctor',
      title: 'Doctor (Author)',
      type: 'reference',
      to: [{ type: 'doctor' }],
      group: 'settings',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
      group: 'settings',
    }),
    defineField({
      name: 'image',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      group: 'settings',
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        },
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'settings',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'meta_title',
      title: 'Meta Title',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'meta_description',
      title: 'Meta Description',
      type: 'text',
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image - [1200x630]',
      type: 'image',
      group: 'seo',
    }),
    defineField({
      name: 'noindex',
      title: 'No Index',
      type: 'boolean',
      initialValue: false,
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      doctor: 'doctor.name',
      media: 'image',
    },
    prepare(selection) {
      const { doctor } = selection;
      return {
        ...selection,
        subtitle: doctor ? `by Dr. ${doctor}` : '',
      };
    },
  },
});