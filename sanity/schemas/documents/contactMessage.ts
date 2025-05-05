import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'contactMessage',
  title: 'Contact Messages',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({ name: 'message', type: 'text' }),
    defineField({ name: 'responded', type: 'boolean', initialValue: false }),
    defineField({ name: 'submittedAt', type: 'datetime' }),
  ],
});