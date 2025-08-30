// /sanity/schemas/documents/blogComment.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'blogComment',
  title: 'Blog Comment',
  type: 'document',
  fields: [
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{ type: 'post' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(50),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Used for OTP & notifications (not public).',
      validation: (Rule) => Rule.required().email().max(120),
    }),
    defineField({
      name: 'phone',
      title: 'Phone (10 digits)',
      type: 'string',
      description: 'Used for OTP (not public).',
      validation: (Rule) =>
        Rule.required()
          .regex(/^\+?(\d{1,3})?\d{10}$/, 'phone')
          .error('Enter a valid 10-digit phone (optionally with country code).'),
    }),
    defineField({
      name: 'question',
      title: 'Comment / Question',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().min(6).max(500),
    }),
    defineField({
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'approvedAt',
      title: 'Approved At',
      type: 'datetime',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'post.title' },
  },
});