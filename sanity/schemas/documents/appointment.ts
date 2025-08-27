// sanity/schemas/documents/appointment.ts
import { defineType, defineField } from 'sanity';
import { Calendar } from 'lucide-react';

// 08:00 → 23:00 in 60m steps. Adjust if you want 30m steps.
const SLOT_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const hour = 8 + i; // 8..23
  return `${hour.toString().padStart(2, '0')}:00`;
});

export default defineType({
  name: 'appointment',
  title: 'Appointments Control',
  type: 'document',
  icon: Calendar,
  fields: [
    defineField({
      name: 'doctor',
      title: 'Doctor',
      type: 'reference',
      to: [{ type: 'doctor' }],
      validation: Rule => Rule.required(),
    }),

    // Weekly defaults: Mon..Sun arrays of time strings
    defineField({
      name: 'weeklyAvailability',
      title: 'Weekly Availability (defaults)',
      type: 'object',
      options: { collapsed: false, collapsible: true },
      fields: [
        ...['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(dow => defineField({
          name: dow,
          title: dow[0].toUpperCase() + dow.slice(1),
          type: 'array',
          of: [{ 
            type: 'string',
          }],
          options: {
            layout: 'tags',
            // pre-fill the options so it’s pick-from-list instead of free typing
            list: SLOT_OPTIONS.map(v => ({ title: v, value: v })),
          },
        }))
      ],
      initialValue: {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
      },
      description: 'Click to add default slots (08:00–23:00).',
    }),

    // Date overrides: full-day or partial blocked slots
    defineField({
      name: 'overrides',
      title: 'Overrides / Leaves',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'date', title: 'Date', type: 'date', validation: Rule => Rule.required() }),
          defineField({ name: 'isFullDay', title: 'Full Day Leave?', type: 'boolean', initialValue: true }),
          defineField({
            name: 'partialSlots',
            title: 'Unavailable Time Slots (if partial)',
            type: 'array',
            of: [{ type: 'string' }],
            options: {
              layout: 'tags',
              list: SLOT_OPTIONS.map(v => ({ title: v, value: v })),
            },
            hidden: ({ parent }) => parent?.isFullDay === true,
          }),
        ],
        preview: {
          select: { date: 'date', isFullDay: 'isFullDay' },
          prepare({ date, isFullDay }) {
            return { title: date ? new Date(date).toDateString() : 'Override', subtitle: isFullDay ? 'Full day' : 'Partial' };
          },
        },
      }],
      description: 'Full-day leave or block specific slots on individual dates.',
    }),
  ],
  preview: {
    select: { title: 'doctor.name' },
    prepare({ title }) {
      return { title: `Appointments — ${title || 'Unknown Doctor'}` };
    },
  },
});