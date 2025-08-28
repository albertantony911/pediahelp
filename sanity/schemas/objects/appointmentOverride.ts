// /Users/albert/Desktop/github_repos/pediahelp/sanity/schemas/objects/appointmentOverride.ts
import { defineType, defineField } from 'sanity'
import { Calendar } from 'lucide-react'

export default defineType({
  name: 'appointmentOverride',
  title: 'Override / Leave',
  type: 'object',
  icon: Calendar,
  fields: [
    defineField({ name: 'date', title: 'Date', type: 'date', validation: (Rule) => Rule.required() }),
    defineField({ name: 'isFullDay', title: 'Full day leave', type: 'boolean', initialValue: true }),
    defineField({
      name: 'partialSlots',
      title: 'Unavailable slots (if partial)',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      hidden: ({ parent }) => parent?.isFullDay === true,
    }),
  ],
  preview: {
    select: { date: 'date', isFullDay: 'isFullDay', partialSlots: 'partialSlots' },
    prepare({ date, isFullDay, partialSlots }) {
      return {
        title: date ? new Date(date).toDateString() : 'Override',
        subtitle: isFullDay ? 'Full day' : `${(partialSlots || []).length} blocked slots`,
      }
    }
  }
})