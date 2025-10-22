import { NextResponse } from 'next/server'
import { sendWithPolicy } from '@/lib/otp-channels'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const t0 = Date.now()
  const tick = (msg: string) => console.log(`[test-msg91] ${msg} +${Date.now() - t0}ms`)

  try {
    const { to = process.env.TEST_EMAIL_TO, subject = 'Test MSG91 Email', text = 'Hello from test-msg91 route!' } = await req.json().catch(() => ({}))

    if (!to) return NextResponse.json({ error: 'Recipient email (to) missing' }, { status: 400 })

    tick('sending...')
    const channelUsed = await sendWithPolicy(to, '000000', 'email') // dummy OTP "000000"
    tick(`done via ${channelUsed}`)

    return NextResponse.json({
      ok: true,
      to,
      channelUsed,
      elapsed: `${Date.now() - t0}ms`
    })
  } catch (e: any) {
    console.error('[test-msg91] error:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'send_failed' }, { status: 500 })
  }
}