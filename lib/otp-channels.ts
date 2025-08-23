import { sendOtpEmail } from './mailer';
import { sendGupshupSMS } from './gupshup-sms';
import { sendGupshupWA } from './gupshup-wa';

export type Channel = 'email'|'sms'|'whatsapp'|'auto';

const isEmail = (id: string) => /\S+@\S+\.\S+/.test(id);
const isPhone = (id: string) => /^\+?\d{10,15}$/.test(id) || /^\d{10,15}$/.test(id);

function normalizePhone(id: string) {
  const digits = id.replace(/[^\d]/g,'');
  if (digits.startsWith('91')) return digits;
  if (digits.length === 10) return '91' + digits;
  return digits;
}

export async function sendWithPolicy(identifier: string, code: string, channel: Channel): Promise<'email'|'sms'|'whatsapp'> {
  // Policy: email → sms → whatsapp (or explicit choice)
  const candidates: Array<'email'|'sms'|'whatsapp'> = channel === 'auto'
    ? (isEmail(identifier) ? ['email','sms','whatsapp'] : ['sms','whatsapp','email'])
    : [channel as any];

  let lastError: any;
  for (const ch of candidates) {
    try {
      if (ch === 'email') {
        if (!isEmail(identifier)) throw new Error('NOT_EMAIL');
        await sendOtpEmail(identifier, code);
      } else if (ch === 'sms') {
        const phone = normalizePhone(identifier);
        if (!isPhone(identifier)) throw new Error('NOT_PHONE');
        await sendGupshupSMS(phone, `OTP: ${code}. Valid 10 min.`);
      } else if (ch === 'whatsapp') {
        const phone = normalizePhone(identifier);
        if (!isPhone(identifier)) throw new Error('NOT_PHONE');
        await sendGupshupWA('+'+phone, code);
      }
      return ch;
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  throw lastError || new Error('otp_delivery_failed');
}