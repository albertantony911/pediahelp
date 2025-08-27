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

// ---------- CAREER APPLICATION (LINK-ONLY) ----------

type CareerBasics = {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  message?: string;
};

type ResumeLink = {
  url: string;        // e.g. https://drive.google.com/...
  filename?: string;  // optional hint
  sizeLabel?: string; // optional e.g. "PDF · 1.2 MB"
};

export function careerApplicationLinkText(p: CareerBasics, resume: ResumeLink) {
  const filenamePart = resume.filename ? ` — ${resume.filename}` : '';
  const sizePart = resume.sizeLabel ? ` (${resume.sizeLabel})` : '';

  return `${BRAND_NAME} — Career Application

Name: ${p.name}
Email: ${p.email}
Phone: ${p.phone || '—'}
Role: ${p.role || '—'}

Message:
${p.message || '—'}

Resume link${filenamePart}${sizePart}:
${resume.url}
`;
}

export function careerApplicationLinkHtml(p: CareerBasics, resume: ResumeLink) {
  const filenamePart = resume.filename ? ` — ${esc(resume.filename)}` : '';
  const sizePart = resume.sizeLabel ? ` (${esc(resume.sizeLabel)})` : '';

  return `
  <div style="background:#ffffff;margin:0;padding:0;width:100%">
    <div style="max-width:640px;margin:0 auto;padding:24px 20px;
      font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${COLOR_INK};line-height:1.6;">
      
      <div style="font-size:14px;font-weight:700;color:${COLOR_TEAL};margin-bottom:12px;">${esc(BRAND_NAME)}</div>
      <h1 style="font-size:18px;font-weight:700;margin:0 0 12px 0;color:${COLOR_DARK}">Career application</h1>

      <table style="width:100%;font-size:14px;margin-bottom:14px;border-collapse:collapse">
        <tr><td style="color:${COLOR_LIGHT};width:110px;padding:4px 0">Name</td><td style="padding:4px 0">${esc(p.name)}</td></tr>
        <tr><td style="color:${COLOR_LIGHT};padding:4px 0">Email</td><td style="padding:4px 0">${esc(p.email)}</td></tr>
        <tr><td style="color:${COLOR_LIGHT};padding:4px 0">Phone</td><td style="padding:4px 0">${esc(p.phone || '—')}</td></tr>
        <tr><td style="color:${COLOR_LIGHT};padding:4px 0">Role</td><td style="padding:4px 0">${esc(p.role || '—')}</td></tr>
      </table>

      <div style="font-size:12px;color:${COLOR_LIGHT};margin-bottom:6px">Message</div>
      <div style="white-space:pre-wrap;margin-bottom:16px">${esc(p.message || '—')}</div>

      <div style="font-size:12px;color:${COLOR_LIGHT};margin-bottom:6px">Resume link${filenamePart}${sizePart}</div>
      <p style="margin:0 0 6px 0;font-size:14px;word-wrap:anywhere;">
        <a href="${esc(resume.url)}" style="color:${COLOR_TEAL};text-decoration:none;">${esc(resume.url)}</a>
      </p>

      <hr style="border:none;height:1px;background:${COLOR_LIGHT};margin:20px 0" />
      <p style="font-size:12px;color:${COLOR_LIGHT};margin:0">
        Tip: If access is restricted, request permission from the applicant or ask them to use “Anyone with the link”.
      </p>
    </div>
  </div>`;
}


// ---------- DOCTOR REVIEW NOTIFY EMAIL ----------

type DoctorReviewPayload = {
  doctorId: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  phone: string;
  reviewId?: string;
  subject?: string;
};

export function doctorReviewNotifyText(p: DoctorReviewPayload) {
  return `${BRAND_NAME} — New Doctor Review

Doctor: ${p.doctorId}
${p.reviewId ? `Review ID: ${p.reviewId}\n` : ''}Name: ${p.name}
Email: ${p.email}
Phone: +91${p.phone}
Rating: ${p.rating}/5

Comment:
${p.comment}
`;
}

export function doctorReviewNotifyHtml(p: DoctorReviewPayload) {
  return `
  <div style="background:#ffffff;margin:0;padding:0;width:100%">
    <div style="max-width:640px;margin:0 auto;padding:24px 20px;
      font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${COLOR_INK};line-height:1.6;">
      
      <div style="font-size:14px;font-weight:700;color:${COLOR_TEAL};margin-bottom:12px;">${esc(BRAND_NAME)}</div>
      <h1 style="font-size:18px;font-weight:700;margin:0 0 12px 0;color:${COLOR_DARK}">New doctor review</h1>

      <table style="width:100%;font-size:14px;margin-bottom:14px;border-collapse:collapse">
        <tr><td style="color:${COLOR_LIGHT};width:120px;padding:4px 0">Doctor</td><td style="padding:4px 0">${esc(p.doctorId)}</td></tr>
        ${p.reviewId ? `<tr><td style="color:${COLOR_LIGHT};padding:4px 0">Review ID</td><td style="padding:4px 0">${esc(p.reviewId)}</td></tr>` : ''}
        <tr><td style="color:${COLOR_LIGHT};padding:4px 0">Name</td><td style="padding:4px 0">${esc(p.name)}</td></tr>
        <tr><td style="color:${COLOR_LIGHT};padding:4px 0">Email</td><td style="padding:4px 0"><a href="mailto:${esc(p.email)}" style="color:${COLOR_TEAL};text-decoration:none">${esc(p.email)}</a></td></tr>
        <tr><td style="color:${COLOR_LIGHT};padding:4px 0">Phone</td><td style="padding:4px 0">+91${esc(p.phone)}</td></tr>
        <tr><td style="color:${COLOR_LIGHT};padding:4px 0">Rating</td><td style="padding:4px 0">${esc(String(p.rating))}/5</td></tr>
      </table>

      <div style="font-size:12px;color:${COLOR_LIGHT};margin-bottom:6px">Comment</div>
      <div style="white-space:pre-wrap;margin-bottom:16px">${esc(p.comment)}</div>

      <hr style="border:none;height:1px;background:${COLOR_LIGHT};margin:20px 0" />
      <p style="font-size:12px;color:${COLOR_LIGHT};margin:0">
        Reply: <a href="mailto:${esc(p.email)}" style="color:${COLOR_TEAL};text-decoration:none">${esc(p.email)}</a>
      </p>
    </div>
  </div>`;
}