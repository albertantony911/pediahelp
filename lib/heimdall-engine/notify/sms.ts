// lib/heimdall-engine/notify/sms.ts

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

export async function sendSms(booking: BookingPayload) {
  const slotReadable = new Date(booking.slot).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Placeholder for actual SMS logic using Twilio/Exotel
  console.log(`\n📲 [SMS] To: ${booking.phone}`);
  console.log(`[SMS] Message:`);
  console.log(`Hello ${booking.patientName}, your appointment for ${booking.childName} with Dr. ${booking.doctor.name} is confirmed for ${slotReadable}.\n`);
}
