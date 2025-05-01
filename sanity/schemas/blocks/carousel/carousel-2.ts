import { defineField, defineType } from 'sanity';
import { Users } from 'lucide-react';

export default defineType({
  name: 'carousel-2',
  type: 'object',
  title: 'Doctor Team Carousel',
  icon: Users,
  fields: [
    defineField({
      name: 'tagLine',
      type: 'string',
      title: 'Tagline (Optional)',
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title (Optional)',
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body (Optional)',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'buttonText',
      type: 'string',
      title: 'Button Text (Optional)',
    }),
    defineField({
      name: 'buttonLink',
      type: 'url',
      title: 'Button Link (Optional)',
    }),
    defineField({
      name: 'padding',
      type: 'section-padding',
    }),
    defineField({
      name: 'colorVariant',
      type: 'color-variant',
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Doctor Team Carousel',
        subtitle: 'Carousel of top 7 doctors',
        media: Users,
      };
    },
  },
});