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

export async function sendEmailViaMsg91({
  from, to, subject, text, html, replyTo,
}: SendArgs): Promise<void> {
  const AUTH = process.env.MSG91_AUTH_KEY!;
  if (!AUTH) throw new Error('MSG91_AUTH_KEY missing');

  const fromParsed = parseAddress(from);
  const toList = to.map(parseAddress);

  const body = {
    // Minimal, template-less payload
    from: fromParsed,                        // { email, name? }
    recipients: [
      {
        to: toList,                          // [{ email, name? }, ...]
        // variables: {...}                   // optional if you use MSG91 templates
      },
    ],
    subject,
    text: text || undefined,
    html: html || undefined,
    reply_to: replyTo?.map(parseAddress),    // [{ email, name? }]
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data?.type === 'error')) {
    const msg = data?.message || data?.errors?.[0]?.message || 'MSG91_EMAIL_SEND_FAILED';
    throw new Error(msg);
  }
}