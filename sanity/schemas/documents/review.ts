import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'review',
  title: 'Doctor Review',
  type: 'document',
  fields: [
    // Add the orderRank field here
    defineField({
      name: 'orderRank',
      title: 'Order Rank',
      type: 'string', // or 'number' based on your requirements
      description: 'Used to manually sort reviews (required by schema)',
      validation: Rule => Rule.required(),
    }),

    defineField({
      name: 'name',
      title: 'Patient Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'rating',
      title: 'Rating (1–5)',
      type: 'number',
      validation: Rule => Rule.min(1).max(5),
    }),
    defineField({
      name: 'comment',
      title: 'Review',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'doctor',
      title: 'Linked Doctor',
      type: 'reference',
      to: [{ type: 'doctor' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
})