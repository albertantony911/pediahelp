// lib/recaptcha.ts
export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (process.env.RECAPTCHA_DISABLE === 'true') {
    console.warn('[recaptcha] Bypassed (RECAPTCHA_DISABLE=true)');
    return true;
  }

  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) {
    console.warn('[recaptcha] Missing RECAPTCHA_SECRET');
    return false;
  }

  const endpoints = [
    // primary
    'https://www.google.com/recaptcha/api/siteverify',
    // alternate: less likely to be blocked
    'https://recaptcha.google.com/recaptcha/api/siteverify',
    // egress workaround for some edge regions
    'https://www.recaptcha.net/recaptcha/api/siteverify',
  ];

  const makeReq = (url: string) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    let res: Response | undefined;
    for (const url of endpoints) {
      try {
        res = await makeReq(url);
        if (res.ok) break;
      } catch {
        continue;
      }
    }
    clearTimeout(timeout);

    if (!res) {
      console.error('[recaptcha] All fetch attempts failed');
      return false;
    }

    const data = await res.json().catch(() => ({}));
    if (!data?.success) {
      console.warn('[recaptcha] Failed:', data);
      return false;
    }
    return data.score == null || data.score >= 0.3;
  } catch (err: any) {
    console.error('[recaptcha] exception:', err?.message || err);
    return false;
  }
}