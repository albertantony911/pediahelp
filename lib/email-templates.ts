// lib/email-templates.ts

// Keep brand defaults centralized (server-side only; safe to read process.env here)
const BRAND_NAME = process.env.BRAND_NAME || 'Pediahelp';
const BRAND_SUPPORT = process.env.BRAND_SUPPORT_EMAIL || process.env.MAIL_USER || '';

// Brand palette (from your CSS vars)
const COLOR_DARK = '#264E53';   // --dark-shade
const COLOR_LIGHT = '#CAD76E';  // --light-shade
const COLOR_TEAL = '#1C947B';   // --mid-shade (primary accent)
const COLOR_INK  = '#0b0d11';   // body text on white

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!));

// ---------- OTP EMAIL ----------

export function otpEmailHtml(code: string, minutes = 10) {
  return `
  <div style="background:#ffffff;margin:0;padding:0;width:100%">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;
      font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${COLOR_INK};line-height:1.6;">
      
      <div style="font-size:14px;font-weight:700;color:${COLOR_TEAL};margin-bottom:16px;">${esc(BRAND_NAME)}</div>
      <h1 style="font-size:18px;font-weight:700;margin:0 0 14px 0;color:${COLOR_DARK}">Your verification code</h1>
      
      <p style="margin:0 0 12px 0">Use this code to continue. It expires in <strong>${minutes} minutes</strong>.</p>
      
      <div style="margin:12px 0;font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:28px;letter-spacing:6px;
        font-weight:800;background:${COLOR_TEAL};color:#fff;padding:10px 16px;border-radius:8px;display:inline-block;">
        ${esc(code)}
      </div>

      <hr style="border:none;height:1px;background:${COLOR_LIGHT};margin:20px 0" />
      <p style="font-size:12px;color:${COLOR_LIGHT};margin:0">If you didn’t request this, you can safely ignore this email.</p>
    </div>
  </div>`;
}

export function otpEmailText(code: string, minutes = 10) {
  return `${BRAND_NAME}
Your verification code: ${code}
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
  return `
  <div style="background:#ffffff;margin:0;padding:0;width:100%">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;
      font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${COLOR_INK};line-height:1.6;">
      
      <div style="font-size:14px;font-weight:700;color:${COLOR_TEAL};margin-bottom:16px;">${esc(BRAND_NAME)}</div>
      <h1 style="font-size:18px;font-weight:700;margin:0 0 14px 0;color:${COLOR_DARK}">New contact</h1>

      <table style="width:100%;font-size:14px;margin-bottom:16px;border-collapse:collapse">
        <tr><td style="color:${COLOR_LIGHT};width:120px;padding:4px 0">Name</td><td style="padding:4px 0">${esc(p.name)}</td></tr>
        <tr><td style="color:${COLOR_LIGHT};padding:4px 0">Email</td><td style="padding:4px 0">${esc(p.email)}</td></tr>
        <tr><td style="color:${COLOR_LIGHT};padding:4px 0">Phone</td><td style="padding:4px 0">${esc(p.phone || '—')}</td></tr>
      </table>

      <div style="font-size:12px;color:${COLOR_LIGHT};margin-bottom:6px">Message</div>
      <div style="white-space:pre-wrap;margin-bottom:20px">${esc(p.message)}</div>

      <hr style="border:none;height:1px;background:${COLOR_LIGHT};margin:20px 0" />
      <p style="font-size:12px;color:${COLOR_LIGHT};margin:0">
        Reply: <a href="mailto:${esc(p.email)}" style="color:${COLOR_TEAL};text-decoration:none">${esc(p.email)}</a>
      </p>

    </div>
  </div>`;
}

export function contactNotifyText(p: ContactPayload) {
  return `${BRAND_NAME} — New contact

Name: ${p.name}
Email: ${p.email}
Phone: ${p.phone || '—'}

Message:
${p.message}
`;
}