import { defineType, defineField } from 'sanity'
import { Stethoscope } from 'lucide-react'

export default defineType({
  name: 'doctor',
  title: 'Doctor',
  icon: Stethoscope,
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Full Name', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug (URL)', type: 'slug', options: { source: 'name', maxLength: 96 }, validation: Rule => Rule.required() }),
    defineField({ name: 'photo', title: 'Profile Photo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'specialty', title: 'Specialty', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'location', title: 'Location (optional)', type: 'string' }),
    defineField({ name: 'languages', title: 'Languages Known', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'appointmentFee', title: 'Consultation Fee (INR)', type: 'number', validation: Rule => Rule.required().min(0) }),
    defineField({ name: 'nextAvailableSlot', title: 'Next Available Slot', type: 'string' }),
    defineField({ name: 'about', title: 'About the Doctor', type: 'text', validation: Rule => Rule.required() }),
    defineField({
      name: 'expertise',
      title: 'Symptoms Treated / Expertise',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List of symptoms or health concerns treated by this doctor',
    }),
    defineField({
      name: 'reviews',
      title: 'Collected Reviews',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'review' }] }],
      readOnly: true,
    }),
    defineField({
      name: 'authoredArticles',
      title: 'Authored Articles',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
    defineField({ name: 'bookingId', title: 'Zcal Link / Booking URL', type: 'url' }),
    defineField({ name: 'externalApiId', title: 'External Doctor API ID (for later SaaS integration)', type: 'string' }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'specialty',
      media: 'photo',
    },
  },
})