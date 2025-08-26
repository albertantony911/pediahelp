// lib/otp-store-redis.ts
import { Redis } from '@upstash/redis';
import { sha256, nowSec } from './crypto';

const redis = Redis.fromEnv();

export type Channel = 'email' | 'sms' | 'whatsapp';
export type Session = {
  identifier: string;
  scope: string;
  otpHash: string;
  expiresAt: number; // unix seconds
  tries: number;
  verified: boolean;
  used: boolean;
  ip?: string;
  channelUsed?: Channel;
  createdAt: number;
  usedAt?: number;
};

const key = (id: string) => `otp:sess:${id}`;

export async function createSession(sessionId: string, s: Omit<Session, 'tries'|'verified'|'used'|'createdAt'>) {
  const now = nowSec();
  const ttl = Math.max(s.expiresAt - now + 900, 900); // keep ~15m after expiry
  const payload: Session = {
    ...s,
    tries: 0,
    verified: false,
    used: false,
    createdAt: now,
  };
  await redis.set(key(sessionId), JSON.stringify(payload), { ex: ttl });
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const val = await redis.get<string>(key(sessionId));
  return val ? JSON.parse(val) as Session : null;
}

async function save(sessionId: string, s: Session) {
  const ttl = Math.max(s.expiresAt - nowSec() + 900, 900);
  await redis.set(key(sessionId), JSON.stringify(s), { ex: ttl });
}

export async function setChannelUsed(sessionId: string, ch: Channel) {
  const s = await getSession(sessionId);
  if (!s) return;
  s.channelUsed = ch;
  await save(sessionId, s);
}

export async function verifyAndBump(sessionId: string, code: string) {
  const s = await getSession(sessionId);
  if (!s) return { ok: false as const, err: 'invalid_session' as const };

  const now = nowSec();
  if (s.expiresAt < now) return { ok: false as const, err: 'expired' as const };
  if (s.used)          return { ok: false as const, err: 'already_used' as const };
  if (s.tries >= 5) {
    s.tries++;
    await save(sessionId, s);
    return { ok: false as const, err: 'too_many_attempts' as const };
  }

  const good = s.otpHash === sha256(code);
  s.tries++;
  if (good) {
    s.verified = true;
    s.usedAt = now;
  }
  await save(sessionId, s);
  return good ? { ok: true as const, scope: s.scope } : { ok: false as const, err: 'invalid_otp' as const };
}

export async function markUsed(sessionId: string) {
  const s = await getSession(sessionId);
  if (!s) return;
  s.used = true;
  s.usedAt = nowSec();
  await save(sessionId, s);
}