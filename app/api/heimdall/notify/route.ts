// app/api/heimdall/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { client } from '@/sanity/lib/client';

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  const booking = await client.fetch(
    `*[_type == "booking" && _id == $bookingId][0]{
      slot,
      patientName,
      childName,
      phone,
      email,
      doctor->{
        name,
        email,
        whatsappNumber
      },
      status
    }`,
    { bookingId }
  );

  if (!booking || booking.status !== 'paid') {
    return NextResponse.json({ error: 'Booking not found or not marked as paid' }, { status: 404 });
  }

  const { slot, patientName, childName, phone, email, doctor } = booking;

  // ✅ 1. Nodemailer Email
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    const slotReadable = new Date(slot).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: `"PediaHelp" <${process.env.SMTP_USER}>`,
      to: [email, doctor?.email].filter(Boolean).join(','),
      subject: '🩺 Appointment Confirmed - PediaHelp',
      text: `Hello ${patientName},

Your appointment for ${childName} has been confirmed with Dr. ${doctor.name}.

📅 Date & Time: ${slotReadable}

Thank you for using PediaHelp!
`,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }

  // ✅ 2. SMS / WhatsApp (Mock)
  console.log(`📲 SMS → ${phone}: Booking confirmed for ${childName} with Dr. ${doctor.name} on ${slot}`);
  console.log(`📲 WhatsApp → ${doctor.whatsappNumber || 'N/A'}: New appointment for ${childName}`);

  return NextResponse.json({ success: true });
}