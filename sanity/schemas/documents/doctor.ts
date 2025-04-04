import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'doctor',
  title: 'Doctor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Profile Photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'specialty',
      title: 'Specialty',
      type: 'string',
    }),
    defineField({
      name: 'designation',
      title: 'Designation',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
    defineField({
      name: 'languages',
      title: 'Languages Known',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'appointmentFee',
      title: 'Consultation Fee (INR)',
      type: 'number',
    }),
    defineField({
      name: 'nextAvailableSlot',
      title: 'Next Available Slot',
      type: 'string',
    }),
    defineField({
      name: 'about',
      title: 'About the Doctor',
      type: 'text',
    }),
    defineField({
      name: 'ratings',
      title: 'Rating (0-5)',
      type: 'number',
      validation: Rule => Rule.min(0).max(5),
    }),
    defineField({
      name: 'reviews',
      title: 'Reviews (user quotes)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'authoredArticles',
      title: 'Authored Articles',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
    defineField({
      name: 'bookingId',
      title: 'Zcal Link / Booking URL',
      type: 'url',
    }),
    defineField({
      name: 'externalApiId',
      title: 'External Doctor API ID (for later SaaS integration)',
      type: 'string',
    }),
  ],
})