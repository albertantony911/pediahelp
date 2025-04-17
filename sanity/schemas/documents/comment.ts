import { defineField, defineType } from 'sanity';
import { MessageCircle } from 'lucide-react';

export default defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  icon: MessageCircle,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email (optional)',
      type: 'string',
    }),
    defineField({
      name: 'comment',
      title: 'Comment',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'post',
      title: 'Related Post',
      type: 'reference',
      to: [{ type: 'post' }],
      validation: Rule => Rule.required(),
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
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'comment',
    },
  },
});