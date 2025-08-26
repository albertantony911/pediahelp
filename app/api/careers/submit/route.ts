// app/api/careers/submit/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { nowSec } from '@/lib/crypto';
import { getSession, markUsed } from '@/lib/otp-store-redis';
import { sendCareerApplicationLink } from '@/lib/mailer';

/** Allow-list of share hosts (preview or share links only; we never download files) */
const ALLOW_HOSTS = new Set([
  // Google
  'drive.google.com',
  'docs.google.com',
  // Dropbox
  'www.dropbox.com',
  'dropbox.com',
  // Microsoft
  'onedrive.live.com',
  '1drv.ms',
  // Box
  'box.com',
  'www.box.com',
  // Generic Google file content (some orgs share via this)
  'storage.googleapis.com',
  // (Add more if you need: sharepoint tenant domains, etc.)
]);

/** HEAD ping with timeout to check reachability (best-effort) */
async function headOk(url: string, ms = 4500): Promise<boolean> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    const r = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: ctl.signal,
    });
    clearTimeout(t);
    // 2xx or 3xx is fine for “link exists / requires auth”
    return r.ok || (r.status >= 300 && r.status < 400);
  } catch {
    return false;
  }
}

/** Trim common tracking params; keep only what’s needed for share links */
function stripTrackingParams(u: URL) {
  const keepParams = new Set(['id', 'resourcekey', 'dl', 'usp', 'rlkey']);
  const toDelete: string[] = [];
  u.searchParams.forEach((_, k) => {
    if (!keepParams.has(k)) toDelete.push(k);
  });
  toDelete.forEach((k) => u.searchParams.delete(k));
}

/** Light normalization for common providers (non-destructive) */
function normalizeShareUrl(u: URL): URL {
  const host = u.hostname.toLowerCase();

  // Dropbox: convert ?dl=0 to ?dl=1 for a more consistent, directly-resolvable link
  if (host === 'www.dropbox.com' || host === 'dropbox.com') {
    const dl = u.searchParams.get('dl');
    if (dl === '0' || !dl) u.searchParams.set('dl', '1');
  }

  // Google Drive: leave as-is; we don’t force “anyone with the link”
  // Users/org policy may require signin and that’s acceptable.

  return u;
}

export async function POST(req: Request) {
  const t0 = Date.now();
  const tick = (l: string) => console.log(`[careers/submit] ${l} +${Date.now() - t0}ms`);

  try {
    tick('begin');
    const body = await req.json();
    const { sessionId, name, email, phone, role, message, resumeLink } = body || {};
    console.log('[careers/submit] payload:', { sessionId, name, email, role, hasMsg: !!message });

    // Basic input guardrails
    if (!sessionId || !name || !email || !resumeLink) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }
    if (String(resumeLink).length > 2048) {
      return NextResponse.json({ error: 'link_too_long' }, { status: 400 });
    }

    // Validate OTP session
    const s = await getSession(sessionId);
    if (!s)                     return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
    if (s.expiresAt < nowSec()) return NextResponse.json({ error: 'expired' }, { status: 400 });
    if (!s.verified)            return NextResponse.json({ error: 'not_verified' }, { status: 400 });
    if (s.used)                 return NextResponse.json({ error: 'already_used' }, { status: 400 });
    if (s.scope !== 'careers')  return NextResponse.json({ error: 'wrong_scope' }, { status: 403 });

    await markUsed(sessionId);
    tick('session_marked_used');

    // Validate and normalize resume URL
    let parsed: URL;
    try {
      parsed = new URL(String(resumeLink));
    } catch {
      return NextResponse.json({ error: 'invalid_link' }, { status: 400 });
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: 'scheme_not_allowed' }, { status: 400 });
    }

    const host = parsed.hostname.toLowerCase();
    if (!ALLOW_HOSTS.has(host)) {
      return NextResponse.json({ error: 'host_not_allowed' }, { status: 400 });
    }

    stripTrackingParams(parsed);
    parsed = normalizeShareUrl(parsed);

    // Best-effort reachability probe (non-fatal)
    const reachable = await headOk(parsed.toString());
    if (!reachable) {
      console.warn('[careers/submit] link_head_failed', { url: parsed.toString() });
    }

    // Archive to Firestore (best-effort; we still try to email)
    try {
      await db.collection('careerApplications').add({
        sessionId,
        name,
        email,
        phone: phone || null,
        role: role || null,
        message: message || null,
        resumeLink: parsed.toString(),
        reachable,
        createdAt: nowSec(),
      });
      tick('archived');
    } catch (e: any) {
      console.error('[careers/submit] archive_failed:', e?.message || e);
      // Continue – email still provides signal.
    }

    // Email (link mode) to your inbox
    const to =
      process.env.CAREERS_RECEIVER ||
      process.env.MAIL_RECEIVER ||
      process.env.MAIL_USER ||
      email;

    try {
      await sendCareerApplicationLink(
        to,
        { name, email, phone, role, message },
        { url: parsed.toString() }
      );
      tick('mail_sent');
    } catch (e: any) {
      console.error('[careers/submit] mailer_error:', e?.message || e);
      // Don’t fail the whole flow – you still have the Firestore record (if that succeeded).
      return NextResponse.json({ ok: true, mail: 'failed' });
    }

    return NextResponse.json({ ok: true, mail: 'sent' });
  } catch (e: any) {
    console.error('[careers/submit] error:', e?.message || e);
    return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
  } finally {
    console.log(`[careers/submit] end total=${Date.now() - t0}ms`);
  }
}