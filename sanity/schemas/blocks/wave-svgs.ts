import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'waveSvgs',
  title: 'Wave SVGs',
  type: 'document',
  fields: [
    defineField({
      name: 'svgs',
      title: 'SVG Filenames',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List of SVG filenames stored in /public/waves/ (e.g., wave-top-desktop-dark-shade-1.svg)',
    }),
  ],
})