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
    defineField({
      name: 'reverseOnMobile',
      title: 'Reverse Layout on Mobile',
      type: 'boolean',
      description: 'If enabled, reverses the image position on mobile devices (below 1024px).',
      initialValue: false,
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
      name: 'link',
      title: 'Button Link',
      type: 'object',
      description: 'Choose an internal page or provide an external URL.',
      fields: [
        defineField({
          name: 'internalLink',
          title: 'Internal Link',
          type: 'reference',
          to: [{ type: 'page' }],
          description: 'Select an internal page for the button.',
        }),
        defineField({
          name: 'externalUrl',
          title: 'External URL',
          type: 'url',
          description: 'Provide an external URL (e.g., https://example.com).',
        }),
      ],
      validation: (Rule) =>
        Rule.custom((fields) => {
          if (fields?.internalLink && fields?.externalUrl) {
            return 'Choose either an internal link or an external URL, not both.'
          }
          return true
        }),
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