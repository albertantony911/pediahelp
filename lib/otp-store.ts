import { kv } from './kv';
import { sha256 } from './crypto';

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
};

const sessionKey = (id: string) => `otp:s:${id}`;
const codeKey = (id: string) => `otp:c:${id}`;

/**
 * Create a new OTP session as a Redis HASH (so we can HSET/HINCRBY later).
 */
export async function createSession(
  sessionId: string,
  data: Omit<Session, 'tries' | 'verified' | 'used'>
) {
  const ttl = Math.max(1, data.expiresAt - Math.floor(Date.now() / 1000));

  await kv.hset(sessionKey(sessionId), {
    identifier: data.identifier,
    scope: data.scope,
    otpHash: data.otpHash,
    expiresAt: data.expiresAt,
    tries: 0,
    verified: 0,
    used: 0,
    ip: data.ip || '',
    channelUsed: '',
  });

  await kv.expire(sessionKey(sessionId), ttl);
}

/** Store plain OTP for a short time so the async sender can fetch it. */
export async function setPlainCode(sessionId: string, code: string, ttlSec = 120) {
  await kv.set(codeKey(sessionId), code, { ex: ttlSec });
}

/** Fetch (and optionally consume) the plain OTP code. */
export async function getPlainCode(sessionId: string, consume = false) {
  const k = codeKey(sessionId);
  const code = await kv.get<string>(k);
  if (consume && code) await kv.del(k);
  return code || null;
}

export async function setChannelUsed(sessionId: string, channel: Channel) {
  await kv.hset(sessionKey(sessionId), { channelUsed: channel });
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const h = await kv.hgetall<Record<string, unknown>>(sessionKey(sessionId));
  if (!h) return null;

  const asBool = (v: unknown) => v === 1 || v === '1' || v === true || v === 'true';
  const asNum = (v: unknown, d = 0) => (typeof v === 'number' ? v : Number(v ?? d));

  return {
    identifier: String(h.identifier ?? ''),
    scope: String(h.scope ?? ''),
    otpHash: String(h.otpHash ?? ''),
    expiresAt: asNum(h.expiresAt, 0),
    tries: asNum(h.tries, 0),
    verified: asBool(h.verified),
    used: asBool(h.used),
    ip: String(h.ip ?? ''),
    channelUsed: (h.channelUsed ? String(h.channelUsed) : '') as Session['channelUsed'],
  };
}

export async function verifyCode(sessionId: string, code: string) {
  const key = sessionKey(sessionId);
  const s = await getSession(sessionId);
  if (!s) return { ok: false as const, err: 'invalid_session' as const };

  const now = Math.floor(Date.now() / 1000);
  if (s.expiresAt < now) return { ok: false as const, err: 'expired' as const };
  if (s.used) return { ok: false as const, err: 'already_used' as const };
  if (s.tries >= 5) return { ok: false as const, err: 'too_many_attempts' as const };

  const good = s.otpHash === sha256(code);

  // Increment tries atomically
  await kv.hincrby(key, 'tries', 1);

  if (!good) return { ok: false as const, err: 'bad_code' as const };

  await kv.hset(key, { verified: 1 });
  return { ok: true as const };
}

export async function markUsed(sessionId: string) {
  await kv.hset(sessionKey(sessionId), { used: 1 });
}