// lib/heimdall-engine/notify/trigger.ts
import { sendEmail } from './email';

type Links = {
  patientJoinUrl?: string;
  doctorJoinUrl?: string;
};

interface BookingPayload {
  bookingId: string;
  patientName: string;
  childName?: string; // optional everywhere
  phone: string;
  email?: string;
  slot: string; // ISO
  doctor: {
    name: string;
    email?: string;
    whatsappNumber?: string;
  };
}

// Stub functions until SMS/WhatsApp are implemented
async function sendSms(_booking: BookingPayload) {
  // no-op
  console.log('[NotifyAll] SMS integration skipped.');
}
async function sendWhatsApp(_booking: BookingPayload) {
  // no-op
  console.log('[NotifyAll] WhatsApp integration skipped.');
}

export async function notifyAll(
  booking: BookingPayload,
  channels: { email?: boolean; sms?: boolean; whatsapp?: boolean },
  links?: Links
): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
  const result = { email: false, sms: false, whatsapp: false };
  const failures: string[] = [];

  if (channels.email) {
    try {
      await sendEmail(booking, links);
      result.email = true;
    } catch (err) {
      console.error('[NotifyAll] Email failed:', err);
      failures.push('email');
    }
  }

  if (channels.sms) {
    try {
      await sendSms(booking);
      result.sms = true;
    } catch (err) {
      console.error('[NotifyAll] SMS failed:', err);
      failures.push('sms');
    }
  }

  if (channels.whatsapp) {
    try {
      await sendWhatsApp(booking);
      result.whatsapp = true;
    } catch (err) {
      console.error('[NotifyAll] WhatsApp failed:', err);
      failures.push('whatsapp');
    }
  }

  if (failures.length) {
    console.warn(`[NotifyAll] Some notifications failed: ${failures.join(', ')}`);
  }

  return result;
}

export async function triggerNotification(
  booking: BookingPayload,
  type: 'confirmation' | 'reminder' | 'cancellation',
  links?: Links
): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
  console.log(`[Notify] Triggering type: ${type.toUpperCase()}`);

  // For now, only email notifications are active
  return notifyAll(booking, { email: true }, links);
}