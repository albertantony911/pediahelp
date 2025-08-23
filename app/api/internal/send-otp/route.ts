export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

import { NextResponse } from 'next/server';
import { getSession, getPlainCode, setChannelUsed } from '@/lib/otp-store';
import { sendWithPolicy, Channel } from '@/lib/otp-channels';

export async function POST(req: Request) {
  const t0 = Date.now();
  const tick = (l: string) =>
    console.log(`[internal/send-otp] ${l} +${Date.now() - t0}ms`);

  try {
    // 🔒 Bearer auth
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || token !== (process.env.SEND_TOKEN || '')) {
      console.error('[internal/send-otp] unauthorized');
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { sessionId, identifier, channel = 'auto' } = await req.json();
    tick(`begin sid=${sessionId} id=${identifier} ch=${channel}`);

    if (!sessionId || !identifier) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    const s = await getSession(sessionId);
    if (!s) {
      console.error('[internal/send-otp] invalid_session', sessionId);
      return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
    }

    // Fetch and consume the plain code
    const code = await getPlainCode(sessionId, true);
    if (!code) {
      console.error('[internal/send-otp] code_not_available', sessionId);
      return NextResponse.json({ error: 'code_not_available' }, { status: 400 });
    }

    const effective: Channel =
      process.env.EMAIL_ONLY === 'true' ? 'email' : (channel as Channel);
    tick(`sending via ${effective}`);

    const used = await sendWithPolicy(identifier, code, effective);
    await setChannelUsed(sessionId, used);
    tick(`sent ok via=${used}`);

    return NextResponse.json({ ok: true, channelUsed: used });
  } catch (e: any) {
    console.error('[internal/send-otp] error:', e?.message || e);
    return NextResponse.json({ error: 'send_failed' }, { status: 500 });
  } finally {
    console.log('[internal/send-otp] end');
  }
}