import { defineType, defineField } from 'sanity';
import { Stethoscope } from 'lucide-react';

export default defineType({
  name: 'doctor',
  title: 'Doctor',
  type: 'document',
  icon: Stethoscope,

  fields: [
    defineField({
      name: 'orderRank',
      title: 'Order Rank',
      type: 'string',
      description: 'Used to manually sort doctors in the list (required by schema)',
      validation: Rule => Rule.required(),
    }),
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
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
      description: 'Include country code, e.g., +91xxxxxxxxxx',
      validation: Rule =>
        Rule.regex(/^\\+?[0-9]{10,15}$/).error('Enter a valid WhatsApp number with country code.'),
      // Optional: use inputComponent for better UX if you want to mask
    }),
    defineField({
      name: 'specialty',
      title: 'Specialty',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location (optional)',
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
      validation: Rule => Rule.required().min(0),
    }),
    defineField({
      name: 'about',
      title: 'About the Doctor',
      type: 'text',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'expertise',
      title: 'Symptoms Treated / Expertise',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List of symptoms or health concerns treated by this doctor',
    }),
    defineField({
      name: 'experienceYears',
      title: 'Years of Experience',
      type: 'number',
      validation: Rule => Rule.min(0).max(100),
      description: 'Number of years of experience (e.g. 8 will show as 8+ years)',
    }),
    defineField({
      name: 'searchKeywords',
      title: 'Hidden Search Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'These keywords will not be shown on the website but will improve search results. Include related conditions, symptoms, or alternate names (e.g. "constipation", "eczema", "cold", etc).',
    }),
    defineField({
      name: 'qualifications',
      title: 'Qualifications & Experience',
      type: 'object',
      fields: [
        defineField({
          name: 'education',
          title: 'Education',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'achievements',
          title: 'Achievements',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'publications',
          title: 'Publications',
          type: 'array',
          of: [{ type: 'string' }],
        }),
        defineField({
          name: 'others',
          title: 'Other Credentials',
          type: 'array',
          of: [{ type: 'string' }],
        }),
      ],
      description: 'Optional structured section for education, achievements, publications, and other credentials.',
    }),
    defineField({
      name: 'averageRating',
      title: 'Average Rating',
      type: 'number',
      description: 'The average rating based on approved reviews.',
      readOnly: true,
    }),
    defineField({
      name: 'reviews',
      title: 'Collected Reviews',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'review' }] }],
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

  preview: {
    select: {
      title: 'name',
      subtitle: 'specialty',
      media: 'photo',
    },
  },
});