const brand = () => ({
  name: process.env.BRAND_NAME || 'PediaHelp',
  color: process.env.BRAND_PRIMARY_COLOR || '#0ea5e9',
  support: process.env.BRAND_SUPPORT_EMAIL || process.env.MAIL_USER || '',
  site: process.env.SITE_URL || '',
});

const baseStyles = (accent: string) => ({
  wrapper: `
    width:100%;background:#f6f7f9;padding:24px 0;margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;
  `,
  card: `
    max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;
    box-shadow:0 10px 30px rgba(2,6,23,0.06);border:1px solid #eef2f7;
  `,
  header: `
    padding:20px 24px;background:${accent};color:#ffffff;font-weight:700;font-size:16px;letter-spacing:.3px;
  `,
  body: `padding:24px 24px 4px 24px;`,
  hr: `border:none;height:1px;background:#e5e7eb;margin:20px 0;`,
  meta: `font-size:12px;color:#6b7280;margin-top:8px;`,
  footer: `padding:16px 24px 22px 24px;font-size:12px;color:#64748b;background:#f8fafc;`,
  btn: `
    display:inline-block;padding:10px 16px;border-radius:10px;background:${accent};
    color:#fff;text-decoration:none;font-weight:600
  `,
  codeBox: `
    font-size:28px;letter-spacing:6px;font-weight:800;background:#0f172a;color:#ffffff;border-radius:12px;
    padding:12px 16px;display:inline-block
  `,
});

export function otpEmailHtml(code: string, minutes = 10) {
  const b = brand();
  const s = baseStyles(b.color);
  return `
  <div style="${s.wrapper}">
    <div style="${s.card}">
      <div style="${s.header}">${b.name} — Verification Code</div>
      <div style="${s.body}">
        <p style="margin:0 0 10px 0">Hi there,</p>
        <p style="margin:0 0 16px 0">
          Use the code below to verify your request. This code expires in <strong>${minutes} minutes</strong>.
        </p>
        <div style="margin:16px 0 8px 0"><span style="${s.codeBox}">${code}</span></div>
        <p style="${s.meta}">Didn’t request this? Ignore this email and no changes will be made.</p>
        ${b.site ? `<p style="${s.meta}">Request originated from <a href="${b.site}" style="color:${b.color};text-decoration:none">${b.site}</a></p>` : ''}
      </div>
      <div style="${s.footer}">
        <div>${b.name} • ${b.support ? `<a href="mailto:${b.support}" style="color:${b.color};text-decoration:none">${b.support}</a>` : ''}</div>
        <div style="margin-top:6px;color:#94a3b8">
          This site is protected by reCAPTCHA and the Google
          <a href="https://policies.google.com/privacy" style="color:${b.color};text-decoration:none">Privacy Policy</a> and
          <a href="https://policies.google.com/terms" style="color:${b.color};text-decoration:none">Terms of Service</a> apply.
        </div>
      </div>
    </div>
  </div>`;
}

export function otpEmailText(code: string, minutes = 10) {
  const b = brand();
  return `${b.name} verification code: ${code}
Expires in ${minutes} minutes.

If you didn’t request this, ignore this email. ${b.site ? `Request from ${b.site}` : ''}`;
}

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  pageSource?: string;
  sessionId?: string;
  scope?: string;
};

export function contactNotifyHtml(p: ContactPayload) {
  const b = brand();
  const s = baseStyles(b.color);
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:8px 0;color:#64748b;width:120px">${label}</td><td style="padding:8px 0;color:#0f172a">${value}</td></tr>`
      : '';
  return `
  <div style="${s.wrapper}">
    <div style="${s.card}">
      <div style="${s.header}">${b.name} — New Contact Submission</div>
      <div style="${s.body}">
        <table style="width:100%;border-collapse:collapse">
          ${row('Name', p.name)}
          ${row('Email', p.email)}
          ${row('Phone', p.phone || '—')}
          ${row('Page', p.pageSource || 'Contact Page')}
          ${row('Scope', p.scope || 'contact')}
          ${row('Session', p.sessionId || '—')}
        </table>
        <div style="${s.hr}"></div>
        <div>
          <div style="font-size:12px;color:#64748b;margin-bottom:6px">Message</div>
          <div style="white-space:pre-wrap;line-height:1.6">${escapeHtml(p.message)}</div>
        </div>
      </div>
      <div style="${s.footer}">
        <div>Reply to the sender directly: <a href="mailto:${p.email}" style="color:${b.color};text-decoration:none">${p.email}</a></div>
        ${b.support ? `<div style="margin-top:6px;color:#94a3b8">Forwarded by ${b.name} • <a href="mailto:${b.support}" style="color:${b.color};text-decoration:none">${b.support}</a></div>` : ''}
      </div>
    </div>
  </div>`;
}

export function contactNotifyText(p: ContactPayload) {
  return `New contact submission

Name: ${p.name}
Email: ${p.email}
Phone: ${p.phone || '—'}
Page: ${p.pageSource || 'Contact Page'}
Scope: ${p.scope || 'contact'}
Session: ${p.sessionId || '—'}

Message:
${p.message}
`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!));
}