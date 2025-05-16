import { sendEmail } from './email';
import { sendSms } from './sms';
import { sendWhatsApp } from './whatsapp';

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

export async function notifyAll(
  booking: BookingPayload,
  channels: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  }
): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
  const result = {
    email: false,
    sms: false,
    whatsapp: false,
  };

  const failures: string[] = [];

  if (channels.email) {
    try {
      await sendEmail(booking);
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

  if (failures.length > 0) {
    console.warn(`[NotifyAll] Some notifications failed: ${failures.join(', ')}`);
  }

  return result;
}

export async function triggerNotification(
  booking: BookingPayload,
  type: 'confirmation' | 'reminder' | 'cancellation'
): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
  console.log(`[Notify] Triggering type: ${type.toUpperCase()}`);

  return await notifyAll(booking, {
    email: true,
    sms: true,
    whatsapp: true,
  });
}
