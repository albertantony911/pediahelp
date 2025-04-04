import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'review',
  title: 'Doctor Review',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Reviewer Name',
    }),
    defineField({
      name: 'rating',
      type: 'number',
      title: 'Rating (0–5)',
      validation: Rule => Rule.min(0).max(5),
    }),
    defineField({
      name: 'comment',
      type: 'text',
      title: 'Review Comment',
    }),
    defineField({
      name: 'doctor',
      type: 'reference',
      to: [{ type: 'doctor' }],
      title: 'Doctor',
    }),
    defineField({
      name: 'approved',
      type: 'boolean',
      title: 'Approved',
      initialValue: true, // you wanted auto-publish
    }),
    defineField({
      name: 'submittedAt',
      type: 'datetime',
      title: 'Submitted At',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],
})