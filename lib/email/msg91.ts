// lib/email/msg91.ts
type SendArgs = {
  from: string;            // e.g. 'Pediahelp <hello@send.pediahelp.in>'
  to: string[];            // one or many recipients
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string[];      // optional
};

function parseAddress(addr: string) {
  // returns { name?: string, email: string }
  const m = addr.match(/^\s*(?:"?([^"]*)"?\s*)?<([^>]+)>\s*$/);
  if (m) return { name: m[1]?.trim() || undefined, email: m[2].trim() };
  return { email: addr.trim() };
}
export async function sendEmailViaMsg91({ from, to, subject, text, html, replyTo }: SendArgs) {
  const AUTH = process.env.MSG91_AUTH_KEY!;
  if (!AUTH) throw new Error('MSG91_AUTH_KEY missing');
  if (!from) throw new Error('EMAIL_FROM missing');
  if (!to?.length) throw new Error('NO_RECIPIENTS');

  const fromParsed = parseAddress(from);
  const toList = to.map(parseAddress);

  const body = {
    from: fromParsed,
    recipients: [{ to: toList }],
    subject,
    text: text || undefined,
    html: html || undefined,
    reply_to: replyTo?.map(parseAddress),
  };

  const res = await fetch('https://control.msg91.com/api/v5/email/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authkey: AUTH,
    },
    body: JSON.stringify(body),
  });

  const textBody = await res.text().catch(() => '');
  let json: any = {};
  try { json = textBody ? JSON.parse(textBody) : {}; } catch {}

  if (!res.ok || json?.type === 'error') {
    console.error('[MSG91] email send fail', { status: res.status, json, text: textBody?.slice(0,400) });
    const msg = json?.message || json?.errors?.[0]?.message || `MSG91_EMAIL_FAILED_${res.status}`;
    throw new Error(msg);
  }
}