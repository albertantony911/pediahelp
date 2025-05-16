import { defineField, defineType } from 'sanity';
import { CalendarCheck2 } from 'lucide-react';

export const booking = defineType({
  name: 'booking',
  title: 'Bookings',
  type: 'document',
  icon: CalendarCheck2,

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
      title: 'Booked Slot (ISO)',
      type: 'datetime',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'patientName',
      title: "Parent's Name",
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'childName',
      title: "Child's Name",
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      validation: Rule =>
        Rule.regex(/^\+91[0-9]{10}$/).error('Must start with +91 and contain exactly 10 digits'),
    }),
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: Rule => Rule.email(),
    }),
    defineField({
      name: 'otp',
      title: 'OTP (Internal)',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'status',
      title: 'Booking Status',
      type: 'string',
      options: {
        list: ['pending', 'verified', 'paid', 'cancelled'],
        layout: 'dropdown',
      },
      initialValue: 'pending',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'razorpayOrderId',
      title: 'Razorpay Order ID',
      type: 'string',
    }),
    defineField({
      name: 'confirmedAt',
      title: 'Confirmed At',
      type: 'datetime',
    }),
    defineField({
      name: 'cancelReason',
      title: 'Cancel Reason (optional)',
      type: 'string',
    }),
    defineField({
      name: 'notes',
      title: 'Internal Notes (optional)',
      type: 'text',
    }),
  ],

  preview: {
    select: {
      title: 'patientName',
      subtitle: 'slot',
      doctor: 'doctor.name',
    },
    prepare({ title, subtitle, doctor }) {
      const formattedDate = new Date(subtitle).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      return {
        title: `${title} (${doctor})`,
        subtitle: `Slot: ${formattedDate}`,
      };
    },
  },
});