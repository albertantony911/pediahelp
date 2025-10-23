// lib/email/msg91.ts
type SendArgs = {
  from: string;            // 'Pediahelp <no-reply@mail.pediahelp.com>'
  to: string[];            // recipients
  subject: string;
  text?: string;           // use this OR html
  html?: string;           // prefer html when present
  replyTo?: string[];
};

function parseAddress(addr: string) {
  const m = addr.match(/^\s*(?:"?([^"]*)"?\s*)?<([^>]+)>\s*$/);
  if (m) return { name: m[1]?.trim() || undefined, email: m[2].trim() };
  return { email: addr.trim() };
}

export async function sendEmailViaMsg91({ from, to, subject, text, html, replyTo }: SendArgs) {
  const AUTH = process.env.MSG91_AUTH_KEY!;
  if (!AUTH) throw new Error('MSG91_AUTH_KEY missing');
  if (!from) throw new Error('EMAIL_FROM missing');
  if (!to?.length) throw new Error('NO_RECIPIENTS');

  const base = process.env.MSG91_EMAIL_BASE_URL || 'https://control.msg91.com/api/v5/email';

  // Pick exactly one body: prefer HTML if provided
  const body =
    (html && { type: 'html' as const, data: html }) ||
    (text && { type: 'text' as const, data: text });

  if (!body || !body.data?.trim()) {
    throw new Error('EMAIL_BODY_EMPTY'); // defensive: avoid 422
  }

  const payload: any = {
    from: parseAddress(from),
    recipients: [{ to: to.map(parseAddress) }],
    subject,
    body,
  };
  if (replyTo?.length) payload.reply_to = replyTo.map(parseAddress);

  const res = await fetch(`${base}/send`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authkey: AUTH,
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text().catch(() => '');
  let json: any = {};
  try { json = raw ? JSON.parse(raw) : {}; } catch {}

  if (!res.ok || json?.hasError || json?.type === 'error') {
    console.error('[MSG91] send fail', { status: res.status, response: json || raw });
    const msg = json?.message || json?.errors?.[0]?.message || `MSG91_EMAIL_FAILED_${res.status}`;
    throw new Error(msg);
  }
  return json;
}