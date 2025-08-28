// /Users/albert/Desktop/github_repos/pediahelp/sanity/schemas/documents/appointment.ts
import { defineType, defineField } from 'sanity'
import { Calendar } from 'lucide-react'
import WeeklyAvailabilityInput from '../../components/WeeklyAvailabilityInput'
import OverridesInput from '../../components/OverridesInput'

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
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'weeklyAvailability',
      title: 'Weekly Availability (defaults)',
      type: 'weeklyAvailability',
      description: 'Tap to select hours for each weekday (08:00–23:00).',
      components: {
        input: WeeklyAvailabilityInput,
      },
    }),

    defineField({
      name: 'overrides',
      title: 'Overrides / Leaves',
      type: 'array',
      of: [{ type: 'appointmentOverride' }],
      description: 'Pick dates to set full-day leave or block specific hours.',
      components: {
        input: OverridesInput,
      },
    }),
  ],
  preview: {
    select: { title: 'doctor.name' },
    prepare({ title }) {
      return { title: `Appointments — ${title || 'Unknown Doctor'}` }
    },
  },
})