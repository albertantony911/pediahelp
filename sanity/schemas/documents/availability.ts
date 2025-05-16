import { defineType, defineField } from 'sanity';

export const availability = defineType({
  name: 'availability',
  title: 'Weekly Availability',
  type: 'document',
  fields: [
    defineField({
      name: 'doctor',
      title: 'Doctor',
      type: 'reference',
      to: [{ type: 'doctor' }],
      validation: Rule => Rule.required(),
    }),
    ...['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day =>
      defineField({
        name: day,
        title: day.charAt(0).toUpperCase() + day.slice(1),
        type: 'array',
        of: [{ type: 'string' }],
        description: 'List of available 1-hour slots in 24h format (e.g. 10:00, 15:00)',
      })
    ),
  ],
  preview: {
    select: {
      title: 'doctor.name',
    },
    prepare({ title }) {
      return {
        title: `Weekly Slots for ${title}`,
      };
    },
  },
});