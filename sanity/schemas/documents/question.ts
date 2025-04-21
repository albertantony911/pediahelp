import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'comment',
  title: 'Blog Question',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'User Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'question',
      title: 'Question',
      type: 'text',
      rows: 4,
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
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'blog',
      title: 'Linked Blog Post',
      type: 'reference',
      to: [{ type: 'post' }],
    }),
  ],
});