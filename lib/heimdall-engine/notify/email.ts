// lib/heimdall-engine/notify/email.ts
import { Resend } from 'resend';
import {
  appointmentPatientHtml,
  appointmentPatientText,
  appointmentDoctorHtml,
  appointmentDoctorText,
} from '@/lib/email-templates';

interface BookingPayload {
  bookingId: string;
  patientName: string;
  childName?: string;
  phone: string;           // 10-digit, you add +91 elsewhere if needed
  email?: string;          // patient email
  slot: string;            // ISO
  doctor: {
    name: string;
    email?: string;
    whatsappNumber?: string;
  };
}

type Links = {
  patientJoinUrl?: string;
  doctorJoinUrl?: string;
};

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM_ADDR = process.env.RESEND_FROM!;
const BRAND = process.env.BRAND_NAME || 'PediaHelp';
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

/**
 * Keep the name `sendEmail` but send two separate emails (patient & doctor),
 * using the shared template file.
 */
export async function sendEmail(booking: BookingPayload, links?: Links) {
  const slotReadable = new Date(booking.slot).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const tasks: Promise<any>[] = [];

  // Patient email (if present)
  if (booking.email) {
    tasks.push(
      resend.emails.send({
        from: FROM_ADDR,
        to: [booking.email],
        subject: `🩺 Appointment Confirmed — ${BRAND}`,
        text: appointmentPatientText({
          brand: BRAND,
          patientName: booking.patientName,
          childName: booking.childName,
          doctorName: booking.doctor.name,
          slotReadable,
          joinUrl: links?.patientJoinUrl,
        }),
        html: appointmentPatientHtml({
          brand: BRAND,
          patientName: booking.patientName,
          childName: booking.childName,
          doctorName: booking.doctor.name,
          slotReadable,
          joinUrl: links?.patientJoinUrl,
        }),
        replyTo: REPLY_TO ? [REPLY_TO] : undefined,
      })
    );
  }

  // Doctor email (if present)
  if (booking.doctor?.email) {
    tasks.push(
      resend.emails.send({
        from: FROM_ADDR,
        to: [booking.doctor.email],
        subject: `🩺 New Appointment — ${BRAND}`,
        text: appointmentDoctorText({
          brand: BRAND,
          doctorName: booking.doctor.name,
          patientName: booking.patientName,
          childName: booking.childName,
          slotReadable,
          joinUrl: links?.doctorJoinUrl,
        }),
        html: appointmentDoctorHtml({
          brand: BRAND,
          doctorName: booking.doctor.name,
          patientName: booking.patientName,
          childName: booking.childName,
          slotReadable,
          joinUrl: links?.doctorJoinUrl,
        }),
        replyTo: REPLY_TO ? [REPLY_TO] : undefined,
      })
    );
  }

  const results = await Promise.all(tasks);
  for (const r of results) {
    if ((r as any)?.error) {
      const err = (r as any).error;
      throw new Error(err?.message || 'RESEND_SEND_FAILED');
    }
  }
}