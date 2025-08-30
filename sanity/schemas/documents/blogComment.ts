// /sanity/schemas/documents/blogComment.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'blogComment',
  title: 'Blog Comment',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'email', type: 'string', validation: (R) => R.required().email() }),
    defineField({ name: 'phone', type: 'string', validation: (R) => R.required().regex(/^\d{10}$/) }),
    defineField({ name: 'question', type: 'text', rows: 3, validation: (R) => R.required() }),
    defineField({ name: 'post', type: 'reference', to: [{ type: 'post' }], validation: (R) => R.required() }),
    defineField({ name: 'submittedAt', type: 'datetime', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'approved', type: 'boolean', initialValue: false }),
    defineField({ name: 'approvedAt', type: 'datetime' }),
  ],
});