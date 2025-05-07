import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'waveDividerVariant',
  title: 'Wave Divider Variant',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'A unique label for this wave variant (e.g., "Dark Shade", "Light Shade").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'desktopSvg',
      title: 'Desktop SVG',
      type: 'image',
      description: 'Upload an SVG for the desktop wave divider. Should be 100px in height.',
      options: { accept: 'image/svg+xml' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mobileSvg',
      title: 'Mobile SVG',
      type: 'image',
      description: 'Upload an SVG for the mobile wave divider. Should be 100px in height.',
      options: { accept: 'image/svg+xml' },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'label',
    },
  },
})