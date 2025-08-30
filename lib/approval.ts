// /lib/approval.ts
import crypto from 'crypto';

const SECRET = process.env.APPROVAL_SECRET!;
if (!SECRET) {
  // You may prefer to throw here in prod only
  console.warn('APPROVAL_SECRET is not set. Approval links will not verify.');
}

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function signApprovalToken(docId: string, kind: string, ttlSec = 60 * 60) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${kind}.${docId}.${exp}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest();
  return `${payload}.${base64url(sig)}`;
}

export function verifyApprovalToken(token: string, docId: string, kind: string) {
  try {
    const [k, id, expStr, sigB64] = token.split('.');
    if (k !== kind || id !== docId) return false;
    const exp = parseInt(expStr, 10);
    if (!exp || exp < Math.floor(Date.now() / 1000)) return false;

    const payload = `${k}.${id}.${exp}`;
    const expected = base64url(crypto.createHmac('sha256', SECRET).update(payload).digest());
    return crypto.timingSafeEqual(Buffer.from(sigB64), Buffer.from(expected));
  } catch {
    return false;
  }
}