// lib/heimdall-engine/notify/whatsapp.ts

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

export async function sendWhatsApp(booking: BookingPayload) {
  const slotReadable = new Date(booking.slot).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const patientMessage = `👋 Hello ${booking.patientName},\n\n✅ Your appointment for ${booking.childName} with Dr. ${booking.doctor.name} is confirmed.\n\n📅 ${slotReadable}\n\nThank you for using PediaHelp!`;

  const doctorMessage = `📢 New Appointment Booked:\n\n👶 Child: ${booking.childName}\n👤 Parent: ${booking.patientName}\n📅 ${slotReadable}`;

  console.log(`\n🟢 [WhatsApp] To Patient (${booking.phone}):\n${patientMessage}`);
  console.log(`🟢 [WhatsApp] To Doctor (${booking.doctor.whatsappNumber}):\n${doctorMessage}\n`);
}