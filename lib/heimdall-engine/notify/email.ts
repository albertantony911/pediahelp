// lib/heimdall-engine/notify/email.ts
import { sendEmailViaMsg91 } from '@/lib/email/msg91';

interface BookingPayload {
  bookingId: string;
  patientName: string;
  childName: string;
  phone: string;
  email: string;
  slot: string;
  doctor: { name: string; email?: string; whatsappNumber?: string };
}

const FROM_ADDR = process.env.EMAIL_FROM!;
const BRAND     = process.env.BRAND_NAME || 'PediaHelp';
const REPLY_TO  = process.env.EMAIL_REPLY_TO ? [process.env.EMAIL_REPLY_TO] : undefined;

export async function sendEmail(booking: BookingPayload) {
  const slotReadable = new Date(booking.slot).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

  await sendEmailViaMsg91({
    from: FROM_ADDR,
    to: toList,
    subject,
    text,
    replyTo: REPLY_TO,
  });
}