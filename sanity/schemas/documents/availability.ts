import { defineField, defineType } from 'sanity';
import { Clock3 } from 'lucide-react';

export default defineType({
  name: 'availability',
  title: 'Weekly Availability',
  type: 'document',
  icon: Clock3,
  fields: [
    defineField({
      name: 'doctor',
      title: 'Doctor',
      type: 'reference',
      to: [{ type: 'doctor' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'monday',
      title: 'Monday',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'tuesday',
      title: 'Tuesday',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'wednesday',
      title: 'Wednesday',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'thursday',
      title: 'Thursday',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'friday',
      title: 'Friday',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'saturday',
      title: 'Saturday',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'sunday',
      title: 'Sunday',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
  ],
  preview: {
    select: {
      title: 'doctor.name',
    },
    prepare(selection) {
      return {
        title: `Availability — ${selection.title}`,
      };
    },
  },
});