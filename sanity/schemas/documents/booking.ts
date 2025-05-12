import { defineField, defineType } from 'sanity';

export const booking = defineType({
  name: 'booking',
  title: 'Booking',
  type: 'document',
  fields: [
    defineField({
      name: 'bookingToken',
      title: 'Booking Token',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Awaiting Verification', value: 'awaiting_verification' },
          { title: 'Confirmed', value: 'confirmed' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Expired', value: 'expired' },
        ],
      },
      initialValue: 'awaiting_verification',
    }),
    defineField({
      name: 'doctorSlug',
      title: 'Doctor Slug',
      type: 'string',
    }),
    defineField({
      name: 'parentName',
      title: "Parent's Name",
      type: 'string',
    }),
    defineField({
      name: 'patientName',
      title: "Child's Name",
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: 'Appointment Date',
      type: 'string',
    }),
    defineField({
      name: 'time',
      title: 'Appointment Time',
      type: 'string',
    }),
    defineField({
      name: 'zcalEventId',
      title: 'Zcal Event ID',
      type: 'string',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    }),
  ],
});