import { sendOtpEmail } from './mailer';
import { sendGupshupSMS } from './gupshup-sms';
import { sendGupshupWA } from './gupshup-wa';

export type Channel = 'email' | 'sms' | 'whatsapp' | 'auto';

const isEmail = (id: string) => /\S+@\S+\.\S+/.test(id);
const isPhone = (id: string) => /^\+?\d{10,15}$/.test(id) || /^\d{10,15}$/.test(id);

function normalizePhone(id: string) {
  const digits = id.replace(/[^\d]/g, '');
  if (digits.startsWith('91')) return digits;
  if (digits.length === 10) return '91' + digits; // assume Indian 10-digit
  return digits;
}

function smsEnvReady() {
  return !!(process.env.GUPSHUP_USER_ID && process.env.GUPSHUP_API_KEY && process.env.GUPSHUP_SENDER_ID);
}
function waEnvReady() {
  return !!(process.env.GUPSHUP_WA_API_KEY && process.env.GUPSHUP_WA_APP_NAME && process.env.GUPSHUP_WA_NUMBER);
}

/**
 * Send OTP according to policy.
 * - Respects EMAIL_ONLY=true to force email (useful while testing).
 * - Prioritizes email for email identifiers; otherwise tries SMS/WA only if creds exist.
 * - Returns the channel actually used.
 */
export async function sendWithPolicy(
  identifier: string,
  code: string,
  channel: Channel
): Promise<'email' | 'sms' | 'whatsapp'> {
  const minutes = 10; // keep in sync with templates

  // Dev/test override
  if (process.env.EMAIL_ONLY === 'true') {
    if (!isEmail(identifier)) throw new Error('NOT_EMAIL');
    await sendOtpEmail(identifier, code, minutes);
    return 'email';
  }

  // Compute candidates
  let candidates: Array<'email' | 'sms' | 'whatsapp'>;

  if (channel === 'auto') {
    if (isEmail(identifier)) {
      candidates = ['email'];
      if (smsEnvReady()) candidates.push('sms');
      if (waEnvReady()) candidates.push('whatsapp');
    } else {
      candidates = [];
      if (smsEnvReady()) candidates.push('sms');
      if (waEnvReady()) candidates.push('whatsapp');
      // as a last resort, allow email attempt only if identifier looks like email
      if (isEmail(identifier)) candidates.push('email');
    }
  } else {
    // explicit channel requested
    candidates = [channel];
  }

  let lastError: any;
  for (const ch of candidates) {
    try {
      if (ch === 'email') {
        if (!isEmail(identifier)) throw new Error('NOT_EMAIL');
        await sendOtpEmail(identifier, code, minutes);
        return 'email';
      }

      if (ch === 'sms') {
        if (!smsEnvReady()) throw new Error('SMS_UNAVAILABLE');
        if (!isPhone(identifier)) throw new Error('NOT_PHONE');
        const phone = normalizePhone(identifier);
        await sendGupshupSMS(phone, `Your ${process.env.BRAND_NAME || 'verification'} code is ${code}. Valid ${minutes} min.`);
        return 'sms';
      }

      if (ch === 'whatsapp') {
        if (!waEnvReady()) throw new Error('WA_UNAVAILABLE');
        if (!isPhone(identifier)) throw new Error('NOT_PHONE');
        const phone = normalizePhone(identifier);
        await sendGupshupWA('+' + phone, code);
        return 'whatsapp';
      }
    } catch (e) {
      lastError = e;
      continue; // try next candidate
    }
  }

  // If nothing worked:
  throw lastError || new Error('otp_delivery_failed');
}