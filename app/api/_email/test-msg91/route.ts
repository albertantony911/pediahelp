export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

/** minimal address parser: "Name <mail@domain>" | "mail@domain" */
function parseAddress(input: string) {
  const m = input.match(/^\s*([^<]+?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { email: input.trim() };
}

export async function POST(req: Request) {
  const t0 = Date.now();
  try {
    const {
      to = process.env.TEST_EMAIL_TO,
      from = process.env.EMAIL_FROM, // e.g. "PediaHelp <hello@mail.pediahelp.com>"
      replyTo = process.env.EMAIL_REPLY_TO, // optional
      subject = 'MSG91 direct test',
      text = 'Hello from /api/_email/test-msg91',
      html,            // optional
      dry = false,     // when true, just echo the request body that would be sent to MSG91
    } = await req.json().catch(() => ({}));

    if (!to)  return NextResponse.json({ error: 'Missing "to" or TEST_EMAIL_TO' }, { status: 400 });
    if (!from) return NextResponse.json({ error: 'Missing EMAIL_FROM in env' }, { status: 400 });

    const AUTH = process.env.MSG91_AUTH_KEY;
    if (!AUTH) return NextResponse.json({ error: 'Missing MSG91_AUTH_KEY in env' }, { status: 400 });

    const fromParsed = parseAddress(from);
    const toList = String(to).split(',').map((s) => parseAddress(s));
    const replyToList = replyTo ? String(replyTo).split(',').map((s) => parseAddress(s)) : undefined;

    const payload = {
      from: fromParsed,                 // { email, name? }
      recipients: [{ to: toList }],     // [{ to: [{email,name?},...] }]
      subject,
      text: text || undefined,
      html: html || undefined,
      reply_to: replyToList,            // [{email,name?}]
    };

    if (dry) {
      return NextResponse.json({ ok: true, dryRun: true, payload });
    }

    const res = await fetch('https://control.msg91.com/api/v5/email/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authkey: AUTH,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text().catch(() => '');
    let json: any = {};
    try { json = rawText ? JSON.parse(rawText) : {}; } catch {}

    // Log useful details to server logs
    console.log('[test-msg91] status=', res.status, 'json=', json || rawText?.slice(0, 400));

    if (!res.ok || json?.type === 'error') {
      const msg = json?.message || json?.errors?.[0]?.message || `MSG91_EMAIL_FAILED_${res.status}`;
      return NextResponse.json({
        ok: false,
        status: res.status,
        error: msg,
        response: json || rawText,
        elapsedMs: Date.now() - t0,
      }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      status: res.status,
      response: json || rawText,
      elapsedMs: Date.now() - t0,
    });
  } catch (e: any) {
    console.error('[test-msg91] error', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'send_failed' }, { status: 500 });
  }
}