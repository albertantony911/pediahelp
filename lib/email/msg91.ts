// lib/email/msg91.ts
type SendArgs = {
  from: string;            // 'Pediahelp <no-reply@mail.pediahelp.com>'
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

  // 🔑 MSG91 expects `body` with { type, data }
  const bodyParts: Array<{ type: 'html' | 'text'; data: string }> = [];
  if (html) bodyParts.push({ type: 'html', data: html });
  if (text) bodyParts.push({ type: 'text', data: text });

  const payload = {
    from: fromParsed,
    recipients: [{ to: toList }],
    subject,
    ...(replyTo?.length ? { reply_to: replyTo.map(parseAddress) } : {}),
    ...(bodyParts.length ? { body: bodyParts } : {}), // or use template_id flow instead
  };

  const res = await fetch(`${base}/send`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authkey: AUTH,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text().catch(() => '');
  let responseJson: any = {};
  try { responseJson = responseText ? JSON.parse(responseText) : {}; } catch {}

  if (!res.ok || responseJson?.hasError || responseJson?.type === 'error') {
    // helpful debug (redacted)
    const redacted = {
      ...payload,
      recipients: [{ to: toList.map(t => ({ ...t, email: t.email.replace(/(.{2}).+(@)/, '$1***$2') })) }],
      body: bodyParts.map(p => ({ ...p, data: `[${p.type} ${p.data.length} chars]` })),
    };
    console.error('[MSG91] send fail', { status: res.status, responseJson: responseJson || responseText, redacted });
    const msg = responseJson?.message || responseJson?.errors?.[0]?.message || `MSG91_EMAIL_FAILED_${res.status}`;
    throw new Error(msg);
  }

  return responseJson;
}