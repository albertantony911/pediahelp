import { defineType, defineField } from 'sanity';
import { MessageSquare, CheckCircle2, User, Stethoscope } from 'lucide-react';

export default defineType({
  name: 'blogComment',
  title: 'Blog Comment',
  type: 'document',
  icon: MessageSquare,
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
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
      hidden: true, // not shown publicly
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      hidden: true, // not shown publicly
    }),
    defineField({
      name: 'question',
      title: 'Comment / Question',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().min(6).max(800),
    }),
    defineField({
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
      icon: CheckCircle2,
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),

    // ---- Answer fields (editable in studio) ----
    defineField({
      name: 'answer',
      title: 'Doctor Answer',
      type: 'text',
      rows: 4,
      icon: MessageSquare,
    }),
    defineField({
      name: 'answeredBy',
      title: 'Answered By (Doctor)',
      type: 'reference',
      to: [{ type: 'doctor' }],
      icon: Stethoscope,
    }),
    defineField({
      name: 'answeredAt',
      title: 'Answered At',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'question',
      approved: 'approved',
    },
    prepare({ title, subtitle, approved }) {
      return {
        title: `${approved ? '✅ ' : '⏳ '} ${title || 'Anonymous'}`,
        subtitle,
      };
    },
  },
});