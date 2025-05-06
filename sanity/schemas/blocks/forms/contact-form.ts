import { defineType, defineField } from 'sanity';
import { Contact2 } from 'lucide-react';

export default defineType({
  name: 'contact-form',
  title: 'Contact Form',
  type: 'object',
  icon: Contact2,
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
    defineField({ name: 'tagLine', type: 'string', title: 'Tagline' }),
    defineField({ name: 'title', type: 'string', title: 'Title' }),
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      type: 'string',
      description: 'Message to display after successful form submission',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      tagLine: 'tagLine',
    },
    prepare({ title, tagLine }) {
      return {
        title: 'Contact Form',
        subtitle: title || tagLine || 'Untitled Contact Form',
      };
    },
  },
});