// /Users/albert/Desktop/github_repos/pediahelp/sanity/schemas/objects/weeklyAvailability.ts
import { defineType, defineField } from 'sanity'

// 08:00 → 23:00 (hourly)
export const SLOT_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const h = 8 + i
  return `${String(h).padStart(2, '0')}:00`
})

export default defineType({
  name: 'weeklyAvailability',
  title: 'Weekly Availability',
  type: 'object',
  fields: [
    ...(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const).map((dow) =>
      defineField({
        name: dow,
        title: dow[0].toUpperCase() + dow.slice(1),
        type: 'array',
        of: [{ type: 'string' }],
        options: {
          layout: 'tags',
          list: SLOT_OPTIONS.map(v => ({ title: v, value: v })),
        },
      })
    ),
  ],
  preview: {
    prepare() {
      return { title: 'Weekly Availability' }
    }
  }
})