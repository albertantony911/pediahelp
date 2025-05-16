import { defineField, defineType } from 'sanity';

export const booking = defineType({
  name: 'booking',
  title: 'Booking',
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
      name: 'slot',
      title: 'Slot Time',
      type: 'datetime',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'patientName',
      title: 'Parent Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'childName',
      title: 'Child Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      validation: Rule =>
        Rule.regex(/^\+91\d{10}$/).error('Must start with +91 and be 10 digits'),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.email().required(),
    }),
    defineField({
      name: 'status',
      title: 'Booking Status',
      type: 'string',
      options: {
        list: ['pending', 'paid', 'cancelled'],
        layout: 'radio',
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'paymentId',
      title: 'Razorpay Payment ID',
      type: 'string',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],

  preview: {
    select: {
      title: 'childName',
      subtitle: 'slot',
      media: 'doctor.photo',
    },
    prepare({ title, subtitle }) {
      return {
        title: `Booking for ${title}`,
        subtitle: new Date(subtitle).toLocaleString(),
      };
    },
  },
});