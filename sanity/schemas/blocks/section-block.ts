import { defineType, defineField } from 'sanity'

const sectionBlock = defineType({
  name: 'section-block',
  type: 'object',
  title: 'Section Block',
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
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Image Left', value: 'image-left' },
          { title: 'Image Right', value: 'image-right' },
        ],
      },
    }),
    defineField({ name: 'tagLine', title: 'Tagline', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text' }],
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
      description: 'Label for the button. Leave empty to hide the button.',
    }),
    defineField({
      name: 'href',
      title: 'Button Link',
      type: 'url',
      description: 'Provide a URL for the button (e.g., https://example.com).',
    }),
    defineField({
      name: 'buttonVariant',
      title: 'Button Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Default', value: 'default' },
          { title: 'Secondary', value: 'secondary' },
          { title: 'Ghost', value: 'ghost' },
          { title: 'Outline', value: 'outline' },
          { title: 'Destructive', value: 'destructive' },
          { title: 'Link', value: 'link' },
          { title: 'WhatsApp', value: 'whatsapp' },
        ],
      },
    }),
  ],
})

export default sectionBlock