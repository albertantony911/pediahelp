// lib/otp-channels.ts
// Decides where to send OTP: email / sms / whatsapp (MSG91)

import { sendOtpEmail } from './mailer';

export type Channel = 'email' | 'sms' | 'whatsapp' | 'auto';

const AUTH_KEY = process.env.MSG91_AUTH_KEY!;
const SENDER_ID = process.env.MSG91_SENDER_ID!;                 // e.g. PEDIHP
const SMS_TEMPLATE_ID = process.env.MSG91_SMS_TEMPLATE_ID!;     // Approved OTP template id
const WA_TEMPLATE = process.env.MSG91_WA_TEMPLATE || '';        // WhatsApp template name
const WA_NUMBER = process.env.MSG91_WHATSAPP_NUMBER || '';      // e.g. 9198xxxxxxx

const isEmail = (id: string) => /\S+@\S+\.\S+/.test(id);
const isPhone = (id: string) => /^\+?\d{10,15}$/.test(id) || /^\d{10,15}$/.test(id);

function normalizePhone(id: string) {
  const digits = id.replace(/[^\d]/g, '');
  // Assume India if 10 digits
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

// --- SMS via MSG91 OTP Flow ---
async function sendOtpSMS(msisdn: string, code: string) {
  // Option A: classic OTP API (template_id, sender, otp)
  const res = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: AUTH_KEY },
    body: JSON.stringify({
      template_id: SMS_TEMPLATE_ID,
      mobile: msisdn,           // in 91XXXXXXXXXX
      otp: code,
      sender: SENDER_ID,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.type === 'error') {
    throw new Error(data?.message || 'MSG91_SMS_FAILED');
  }
}

// --- WhatsApp via MSG91 templated message ---
async function sendOtpWhatsApp(msisdn: string, code: string) {
  if (!WA_TEMPLATE || !WA_NUMBER) throw new Error('WA_NOT_CONFIGURED');

  const res = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: AUTH_KEY },
    body: JSON.stringify({
      to: msisdn,        // 91XXXXXXXXXX (no +)
      from: WA_NUMBER,   // 91XXXXXXXXXX
      type: 'template',
      template: {
        name: WA_TEMPLATE,
        language: { code: 'en' },
        // Template must have 1 param for code:
        components: [{ type: 'body', parameters: [{ type: 'text', text: code }] }],
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.type === 'error') {
    throw new Error(data?.message || 'MSG91_WA_FAILED');
  }
}

// --- Policy router (keeps EMAIL_ONLY + FAST_SEND behavior upstream) ---
export async function sendWithPolicy(
  identifier: string,
  code: string,
  channel: Channel
): Promise<'email' | 'sms' | 'whatsapp'> {
  const minutes = 10; // keep in sync with templates

  // Force email (dev/testing)
  if (process.env.EMAIL_ONLY === 'true') {
    if (!isEmail(identifier)) throw new Error('NOT_EMAIL');
    await sendOtpEmail(identifier, code, minutes);
    return 'email';
  }

  // Decide candidates
  let candidates: Array<'email' | 'sms' | 'whatsapp'> = [];

  if (channel === 'auto') {
    if (isEmail(identifier)) {
      candidates.push('email');
    } else if (isPhone(identifier)) {
      // Try SMS first; WA optional if configured
      candidates.push('sms');
      if (WA_TEMPLATE && WA_NUMBER) candidates.push('whatsapp');
    }
  } else {
    candidates = [channel];
  }

  if (candidates.length === 0) {
    // fallback: if it looks like email, email; if phone, sms
    if (isEmail(identifier)) candidates = ['email'];
    else if (isPhone(identifier)) candidates = ['sms'];
  }

  let lastErr: any;
  for (const ch of candidates) {
    try {
      if (ch === 'email') {
        if (!isEmail(identifier)) throw new Error('NOT_EMAIL');
        await sendOtpEmail(identifier, code, minutes);
        return 'email';
      }
      if (ch === 'sms') {
        if (!isPhone(identifier)) throw new Error('NOT_PHONE');
        await sendOtpSMS(normalizePhone(identifier), code);
        return 'sms';
      }
      if (ch === 'whatsapp') {
        if (!isPhone(identifier)) throw new Error('NOT_PHONE');
        await sendOtpWhatsApp(normalizePhone(identifier), code);
        return 'whatsapp';
      }
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  throw lastErr || new Error('otp_delivery_failed');
}