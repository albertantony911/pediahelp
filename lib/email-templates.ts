const brand = () => ({
  name: process.env.BRAND_NAME || 'PediaHelp',
  color: process.env.BRAND_PRIMARY_COLOR || '#1C947B', // default to your teal
  support: process.env.BRAND_SUPPORT_EMAIL || process.env.MAIL_USER || '',
  site: process.env.SITE_URL || '',
});

// ---------- OTP EMAIL ----------

export function otpEmailHtml(code: string, minutes = 10) {
  const BRAND_NAME = process.env.BRAND_NAME || 'PediaHelp';
  const SUPPORT = process.env.BRAND_SUPPORT_EMAIL || process.env.MAIL_USER || '';

  // Brand palette
  const DARK = '#264E53';   // --dark-shade
  const LIGHT = '#CAD76E';  // --light-shade
  const MID = '#1C947B';    // --mid-shade (teal)
  const BG = MID;           // Use teal as background
  const FG = '#0b0d11';

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!));

  const wrap = `
    width:100%;background:${BG};margin:0;padding:24px 0;
    font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    color:${FG};line-height:1.6;
  `;
  const card = `
    max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${LIGHT};
    border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(2,6,23,0.10);
  `;
  const head = `
    padding:16px 20px;font-weight:600;font-size:14px;color:#fff;background:${DARK};
  `;
  const body = `padding:20px 20px 8px 20px;`;
  const foot = `padding:14px 20px;font-size:12px;background:${DARK};color:#fff;`;
  const meta = `color:#6b7280;font-size:12px;margin-top:8px;`;
  const codeBox = `
    font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;
    font-size:24px;letter-spacing:6px;font-weight:700;background:${DARK};color:#fff;border-radius:12px;
    padding:10px 14px;display:inline-block;user-select:all;
  `;

  return `
  <div style="${wrap}">
    <div style="${card}">
      <div style="${head}">${esc(BRAND_NAME)} · Verification</div>
      <div style="${body}">
        <p style="margin:0 0 8px 0">Use this code to continue. It expires in <strong>${minutes} minutes</strong>.</p>
        <div style="margin:12px 0 6px 0"><span style="${codeBox}">${esc(code)}</span></div>
        <p style="${meta}">Didn’t request this? You can ignore this email.</p>
      </div>
      <div style="${foot}">
        <div>${esc(BRAND_NAME)}${
          SUPPORT ? ` • <a href="mailto:${SUPPORT}" style="color:${LIGHT};text-decoration:none">${SUPPORT}</a>` : ''
        }</div>
        <div style="margin-top:6px;color:#e6f0f0">
          Protected by reCAPTCHA ·
          <a href="https://policies.google.com/privacy" style="color:${LIGHT};text-decoration:none">Privacy</a> ·
          <a href="https://policies.google.com/terms" style="color:${LIGHT};text-decoration:none">Terms</a>
        </div>
      </div>
    </div>
  </div>`;
}

export function otpEmailText(code: string, minutes = 10) {
  const b = brand();
  return `${b.name} verification code: ${code}
Expires in ${minutes} minutes.

If you didn’t request this, ignore this email.`;
}

// ---------- CONTACT NOTIFY EMAIL ----------

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

export function contactNotifyHtml(p: ContactPayload) {
  const BRAND_NAME = process.env.BRAND_NAME || 'PediaHelp';

  const DARK = '#264E53';
  const LIGHT = '#CAD76E';
  const MID = '#1C947B';
  const BG = MID; // teal background
  const FG = '#0b0d11';

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!));

  const wrap = `
    width:100%;background:${BG};margin:0;padding:24px 0;
    font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    color:${FG};line-height:1.6;
  `;
  const card = `
    max-width:560px;margin:0 auto;background:#fff;border:1px solid ${LIGHT};
    border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(2,6,23,0.10);
  `;
  const head = `
    padding:16px 20px;font-weight:600;font-size:14px;color:#fff;background:${DARK};
  `;
  const body = `padding:20px 20px 8px 20px;`;
  const foot = `padding:14px 20px;font-size:12px;background:${DARK};color:#fff;`;
  const hr = `border:none;height:1px;background:${LIGHT};margin:16px 0;`;

  const row = (label: string, value?: string) =>
    value
      ? `
    <tr>
      <td style="padding:6px 0;color:#6b7280;width:120px">${esc(label)}</td>
      <td style="padding:6px 0;color:${FG}">${esc(value)}</td>
    </tr>`
      : '';

  return `
  <div style="${wrap}">
    <div style="${card}">
      <div style="${head}">${esc(BRAND_NAME)} · New contact</div>
      <div style="${body}">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${row('Name', p.name)}
          ${row('Email', p.email)}
          ${row('Phone', p.phone || '—')}
        </table>
        <div style="${hr}"></div>
        <div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px">Message</div>
          <div style="white-space:pre-wrap">${esc(p.message)}</div>
        </div>
      </div>
      <div style="${foot}">
        <div>Reply: <a href="mailto:${esc(p.email)}" style="color:${LIGHT};text-decoration:none">${esc(p.email)}</a></div>
      </div>
    </div>
  </div>`;
}

export function contactNotifyText(p: ContactPayload) {
  return `New contact submission

Name: ${p.name}
Email: ${p.email}
Phone: ${p.phone || '—'}

Message:
${p.message}
`;
}