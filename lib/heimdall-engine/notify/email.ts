// lib/heimdall-engine/notify/email.ts
import nodemailer from 'nodemailer';

interface BookingPayload {
  bookingId: string;
  patientName: string;
  childName: string;
  phone: string;
  email: string;
  slot: string;
  doctor: {
    name: string;
    email: string;
    whatsappNumber: string;
  };
}

export async function sendEmail(booking: BookingPayload) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const slotReadable = new Date(booking.slot).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const mailOptions = {
    from: `PediaHelp <${process.env.SMTP_USER}>`,
    to: [booking.email, booking.doctor.email].filter(Boolean).join(','),
    subject: '🩺 Appointment Confirmed - PediaHelp',
    text: `Hello ${booking.patientName},

Your appointment for ${booking.childName} has been confirmed with Dr. ${booking.doctor.name}.

📅 Date & Time: ${slotReadable}

Thank you for using PediaHelp!`,
  };

  await transporter.sendMail(mailOptions);
  console.log('✅ Email sent to:', mailOptions.to);
}
