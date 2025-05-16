import { defineType, defineField } from 'sanity';

// Change export style to match your other schema files
const leave = defineType({
  name: 'leave',
  title: 'Doctor Leave',
  type: 'document',
  fields: [
    defineField({
      name: 'doctor',
      title: 'Doctor',
      type: 'reference',
      to: [{ type: 'doctor' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date of Leave',
      type: 'date',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'isFullDay',
      title: 'Full Day Leave?',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'partialLeaveSlots',
      title: 'Unavailable Time Slots (if partial)',
      type: 'array',
      of: [{ type: 'string' }],
      // 🔥 Comment this out temporarily
      // hidden: ({ parent }) => parent?.isFullDay === true,
    }),
  ],
  preview: {
    select: {
      title: 'doctor.name',
      subtitle: 'date',
    },
    prepare({ title, subtitle }) {
      return {
        title: `Leave for ${title}`,
        subtitle: new Date(subtitle).toDateString(),
      };
    },
  },
});

// Export as default to match the import pattern used in schema.ts
export default leave;