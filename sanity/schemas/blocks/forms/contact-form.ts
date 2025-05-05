import { defineField, defineType } from 'sanity';
import { Mail } from 'lucide-react';

export default defineType({
  name: 'contact-form',
  title: 'Contact Form',
  type: 'object',
  icon: Mail,
  fields: [
    defineField({
      name: 'theme',
      title: 'Theme Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Dark Shade', value: 'dark-shade' },
          { title: 'Mid Shade', value: 'mid-shade' },
          { title: 'Light Shade', value: 'light-shade' },
          { title: 'White', value: 'white' },
        ],
      },
    }),
    defineField({
      name: 'tagLine',
      title: 'Tagline',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'successMessage',
      title: 'Thank You Message',
      type: 'text',
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: 'Contact Form',
        subtitle: title,
      };
    },
  },
});