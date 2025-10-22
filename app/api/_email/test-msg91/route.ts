import type { NextApiRequest, NextApiResponse } from 'next';

function parseAddress(input: string) {
  const m = input.match(/^\s*([^<]+?)\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { email: input.trim() };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      to = process.env.TEST_EMAIL_TO,
      from = process.env.EMAIL_FROM,
      replyTo = process.env.EMAIL_REPLY_TO,
      subject = 'MSG91 direct test',
      text = 'Hello from /api/_email/test-msg91',
      html,
      dry = false,
    } = (req.body || {}) as any;

    if (!to)  return res.status(400).json({ error: 'Missing "to" or TEST_EMAIL_TO' });
    if (!from) return res.status(400).json({ error: 'Missing EMAIL_FROM in env' });

    const AUTH = process.env.MSG91_AUTH_KEY;
    if (!AUTH) return res.status(400).json({ error: 'Missing MSG91_AUTH_KEY in env' });

    const fromParsed = parseAddress(from);
    const toList = String(to).split(',').map((s) => parseAddress(s));
    const replyToList = replyTo ? String(replyTo).split(',').map((s) => parseAddress(s)) : undefined;

    const payload = {
      from: fromParsed,
      recipients: [{ to: toList }],
      subject,
      text: text || undefined,
      html: html || undefined,
      reply_to: replyToList,
    };

    if (dry) return res.status(200).json({ ok: true, dryRun: true, payload });

    const r = await fetch('https://control.msg91.com/api/v5/email/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', authkey: AUTH },
      body: JSON.stringify(payload),
    });

    const raw = await r.text().catch(() => '');
    let json: any = {}; try { json = raw ? JSON.parse(raw) : {}; } catch {}
    console.log('[test-msg91] status=', r.status, 'json=', json || raw?.slice(0, 400));

    if (!r.ok || json?.type === 'error') {
      const msg = json?.message || json?.errors?.[0]?.message || `MSG91_EMAIL_FAILED_${r.status}`;
      return res.status(502).json({ ok: false, status: r.status, error: msg, response: json || raw });
    }

    return res.status(200).json({ ok: true, status: r.status, response: json || raw });
  } catch (e: any) {
    console.error('[test-msg91] error', e?.message || e);
    return res.status(500).json({ ok: false, error: e?.message || 'send_failed' });
  }
}