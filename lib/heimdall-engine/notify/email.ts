// lib/heimdall-engine/notify/email.ts
import { Resend } from 'resend';

interface BookingPayload {
  bookingId: string;
  patientName: string;
  childName: string;
  phone: string;
  email: string;
  slot: string;
  doctor: {
    name: string;
    email?: string;
    whatsappNumber?: string;
  };
}

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM_ADDR = process.env.RESEND_FROM!;
const BRAND = process.env.BRAND_NAME || 'PediaHelp';
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

export async function sendEmail(booking: BookingPayload) {
  const slotReadable = new Date(booking.slot).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `🩺 Appointment Confirmed — ${BRAND}`;
  const text = [
    `Hello ${booking.patientName},`,
    ``,
    `Your appointment for ${booking.childName} has been confirmed with Dr. ${booking.doctor.name}.`,
    ``,
    `📅 ${slotReadable}`,
    ``,
    `Thank you for using ${BRAND}!`,
  ].join('\n');

  const toList = [booking.email, booking.doctor?.email].filter(Boolean) as string[];

  const result = await resend.emails.send({
    from: FROM_ADDR,
    to: toList,
    subject,
    text,
    replyTo: REPLY_TO ? [REPLY_TO] : undefined,
  });

  if ((result as any)?.error) {
    const err = (result as any).error;
    throw new Error(err?.message || 'RESEND_SEND_FAILED');
  }
}