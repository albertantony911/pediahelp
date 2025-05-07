import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'waveDivider',
  title: 'Wave Divider',
  type: 'object',
  fields: [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'reference',
      to: [{ type: 'waveDividerVariant' }],
      description: 'Select a wave divider variant by its label.',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      label: 'variant.label',
    },
    prepare({ label }) {
      return {
        title: `Wave Divider: ${label || 'No variant selected'}`,
      }
    },
  },
})