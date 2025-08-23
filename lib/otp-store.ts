import { db } from '@/lib/firebase-admin';
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
  createdAt: number;
};

export async function createSessionFS(sessionId: string, data: Omit<Session, 'tries'|'verified'|'used'|'createdAt'>) {
  const doc = db.collection('otpSessions').doc(sessionId);
  await doc.set({
    ...data,
    tries: 0,
    verified: false,
    used: false,
    createdAt: Math.floor(Date.now()/1000),
  });
}

export async function setChannelUsedFS(sessionId: string, channel: Channel) {
  await db.collection('otpSessions').doc(sessionId).update({ channelUsed: channel });
}

export async function getSessionFS(sessionId: string): Promise<Session | null> {
  const snap = await db.collection('otpSessions').doc(sessionId).get();
  if (!snap.exists) return null;
  return snap.data() as Session;
}

export async function verifyCodeFS(sessionId: string, code: string) {
  const ref = db.collection('otpSessions').doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) return { ok:false as const, err:'invalid_session' as const };
  const s = snap.data() as Session;
  const now = Math.floor(Date.now()/1000);

  if (s.expiresAt < now) return { ok:false as const, err:'expired' as const };
  if (s.used) return { ok:false as const, err:'already_used' as const };
  if (s.tries >= 5) { await ref.update({ tries: s.tries + 1 }); return { ok:false as const, err:'too_many_attempts' as const }; }

  const good = s.otpHash === sha256(code);
  await ref.update({ tries: s.tries + 1, verified: good ? true : s.verified });
  return good ? { ok:true as const } : { ok:false as const, err:'bad_code' as const };
}

export async function markUsedFS(sessionId: string) {
  await db.collection('otpSessions').doc(sessionId).update({ used: true, usedAt: Math.floor(Date.now()/1000) });
}