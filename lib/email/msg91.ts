// lib/email/msg91.ts
type SendArgs = {
  from: string;            // 'Brand <no-reply@yourdomain.com>'
  to: string[];            // recipients
  subject: string;
  text?: string;
  html?: string;
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

  const fromParsed = parseAddress(from);
  const toList = to.map(parseAddress);

  // ✅ MSG91 expects a `content` array; include only the parts you have
  const content: Array<{ type: 'html' | 'text'; value: string }> = [];
  if (html) content.push({ type: 'html', value: html });
  if (text) content.push({ type: 'text', value: text });

  const body = {
    from: fromParsed,
    recipients: [{ to: toList }],             // cc/bcc can be added here if needed
    subject,
    content,                                   // <-- key change
    ...(replyTo?.length
      ? { reply_to: replyTo.map(parseAddress) }
      : {}),
  };

  const res = await fetch(`${base}/send`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authkey: AUTH,                            // header name must be `authkey`
    },
    body: JSON.stringify(body),
  });

  const textBody = await res.text().catch(() => '');
  let json: any = {};
  try { json = textBody ? JSON.parse(textBody) : {}; } catch {}

  if (!res.ok || json?.type === 'error') {
    console.error('[MSG91] email send fail', { status: res.status, json, text: textBody?.slice(0, 400) });
    const msg = json?.message || json?.errors?.[0]?.message || `MSG91_EMAIL_FAILED_${res.status}`;
    throw new Error(msg);
  }

  return json;
}