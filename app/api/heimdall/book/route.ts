import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import otpGenerator from 'otp-generator';

export async function POST(req: NextRequest) {
    console.log('[API] /book hit');
  const body = await req.json();
    console.log("Incoming Booking Payload:", JSON.stringify(body, null, 2));
  const { doctorId, slot, patient } = body;
  if (!doctorId || !slot || !patient?.parentName || !patient?.childName || !patient?.phone || !patient?.email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

// Generate OTP
const otp = otpGenerator.generate(6, {
  upperCaseAlphabets: false,
  lowerCaseAlphabets: false,
  specialChars: false,
  digits: true,
});

  // Check if the slot is already booked
  const alreadyBooked = await client.fetch(
    `*[_type == "booking" && doctor._ref == $doctorId && slot == $slot][0]`,
    { doctorId, slot }
  );

  if (alreadyBooked) {
    return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });
  }

  // Create temporary booking in Sanity
  const booking = await client.create({
    _type: 'booking',
    doctor: { _type: 'reference', _ref: doctorId },
    slot,
    patientName: patient.parentName,
    childName: patient.childName,
    phone: patient.phone,
    email: patient.email,
    status: 'pending',
  });

  // Store OTP temporarily in-memory (use Redis later)
  globalThis.tempOtps ||= {};
  globalThis.tempOtps[booking._id] = otp;

  // Mock send OTP
  console.log(`[DEBUG] OTP for booking ${booking._id}: ${otp}`);
  console.log("Incoming Booking Payload:", body);
  return NextResponse.json({ bookingId: booking._id, otp }); // ⚠️ Return OTP only in dev!
}

