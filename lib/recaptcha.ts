// lib/recaptcha.ts
export async function verifyRecaptcha(token: string): Promise<boolean> {
  // DEV/preview bypass
  if (process.env.RECAPTCHA_DISABLE === 'true') return true;

  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) {
    console.warn('[recaptcha] Missing RECAPTCHA_SECRET');
    return false;
  }

  // Two endpoints (some networks block one of them)
  const endpoints = [
    'https://www.google.com/recaptcha/api/siteverify',
    'https://recaptcha.google.com/recaptcha/api/siteverify',
  ];

  const makeReq = (url: string) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });

  try {
    // simple timeout guard
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4500);

    let res = await makeReq(endpoints[0]).catch(() => undefined);
    if (!res) res = await makeReq(endpoints[1]).catch(() => undefined);

    clearTimeout(t);

    if (!res) {
      console.error('[recaptcha] fetch failed to both endpoints');
      return false;
    }
    const data = await res.json().catch(() => ({} as any));
    if (!data?.success) {
      console.warn('[recaptcha] verification failed:', data);
      return false;
    }

    // If you’re on v3, enforce a floor score; otherwise just return success.
    return data.score == null || data.score >= 0.3;
  } catch (e: any) {
    console.error('[recaptcha] exception:', e?.message || e);
    return false;
  }
}