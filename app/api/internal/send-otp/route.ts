export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

import { NextResponse } from 'next/server';
import { getSession, getPlainCode, setChannelUsed } from '@/lib/otp-store';
import { sendWithPolicy, Channel } from '@/lib/otp-channels';

export async function POST(req: Request) {
  try {
    // 🔒 Authorization
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || token !== (process.env.SEND_TOKEN || '')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { sessionId, identifier, channel = 'auto' } = await req.json();
    if (!sessionId || !identifier) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // Ensure session is valid
    const s = await getSession(sessionId);
    if (!s) return NextResponse.json({ error: 'invalid_session' }, { status: 400 });

    // Pull the OTP code (consume it so it's not reused)
    const code = await getPlainCode(sessionId, true);
    if (!code) return NextResponse.json({ error: 'code_not_available' }, { status: 400 });

    const effective: Channel =
      process.env.EMAIL_ONLY === 'true' ? 'email' : (channel as Channel);

    // Actually send
    const used = await sendWithPolicy(identifier, code, effective);
    await setChannelUsed(sessionId, used);

    return NextResponse.json({ ok: true, channelUsed: used });
  } catch (e: any) {
    console.error('[internal/send-otp] error:', e?.message || e);
    return NextResponse.json({ error: 'send_failed' }, { status: 500 });
  }
}