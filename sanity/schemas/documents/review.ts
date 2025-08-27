import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'review',
  title: 'Doctor Review',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Patient Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Required for OTP + notifications (not displayed publicly).',
      validation: (Rule) => Rule.required().email().max(120),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      description: 'Required 10-digit Indian mobile number for OTP.',
      validation: (Rule) =>
        Rule.required()
          .regex(/^\+?(\d{1,3})?\d{10}$/, 'phone')
          .error('Must be a valid 10-digit phone number (optionally with country code).'),
    }),
    defineField({
      name: 'rating',
      title: 'Rating (1–5)',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
    }),
    defineField({
      name: 'comment',
      title: 'Review',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'doctor',
      title: 'Linked Doctor',
      type: 'reference',
      to: [{ type: 'doctor' }],
      validation: (Rule) => Rule.required(),
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
    defineField({
      name: 'orderRank',
      title: 'Order Rank',
      type: 'string',
      hidden: true,
    }),
  ],
});