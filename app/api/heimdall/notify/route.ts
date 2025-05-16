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
      }
    }`,
    { bookingId }
  );

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const { slot, patientName, childName, phone, email, doctor } = booking;

  // 1️⃣ Email via nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your provider
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const mailOptions = {
    from: `"PediaHelp" <${process.env.SMTP_USER}>`,
    to: [email, doctor?.email || ''].filter(Boolean).join(','),
    subject: 'Booking Confirmation',
    text: `Hello,

Booking confirmed for ${childName} under ${doctor.name}.

Slot: ${new Date(slot).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
    })}

Thank you!
- PediaHelp`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent');
  } catch (err) {
    console.error('❌ Email error:', err);
  }

  // 2️⃣ SMS/WhatsApp (mock)
  console.log(`📲 [SMS to ${phone}] — Booking confirmed with ${doctor.name} on ${slot}`);
  console.log(`📲 [WhatsApp to ${doctor.whatsappNumber}] — New appointment booked for ${childName}`);

  return NextResponse.json({ success: true });
}