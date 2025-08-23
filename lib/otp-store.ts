import { kv } from './kv';
import { sha256 } from './crypto';

type Channel = 'email' | 'sms' | 'whatsapp';
type Session = {
  identifier: string;
  scope: string;
  otpHash: string;
  expiresAt: number; // unix sec
  tries: number;
  verified: boolean;
  used: boolean;
  ip?: string;
  channelUsed?: Channel;
};

const key = (id: string) => `otp:s:${id}`;

export async function createSession(sessionId: string, data: Omit<Session, 'tries'|'verified'|'used'>) {
  const ttl = Math.max(1, data.expiresAt - Math.floor(Date.now()/1000));
  const value: Session = { ...data, tries: 0, verified: false, used: false };
  await kv.set(key(sessionId), value, { ex: ttl });
}

export async function setChannelUsed(sessionId: string, channel: Channel) {
  await kv.hset(key(sessionId), { channelUsed: channel });
}

export async function getSession(sessionId: string) {
  return (await kv.get<Session>(key(sessionId))) || null;
}

export async function verifyCode(sessionId: string, code: string) {
  const k = key(sessionId);
  const s = await kv.get<Session>(k);
  if (!s) return { ok: false as const, err: 'invalid_session' as const };
  const now = Math.floor(Date.now()/1000);
  if (s.expiresAt < now) return { ok: false as const, err: 'expired' as const };
  if (s.used) return { ok: false as const, err: 'already_used' as const };
  if (s.tries >= 5) return { ok: false as const, err: 'too_many_attempts' as const };

  const good = s.otpHash === sha256(code);
  await kv.hincrby(k, 'tries', 1);
  if (!good) return { ok: false as const, err: 'bad_code' as const };

  await kv.hset(k, { verified: true });
  return { ok: true as const };
}

export async function markUsed(sessionId: string) {
  await kv.hset(key(sessionId), { used: true });
}