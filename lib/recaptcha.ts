// lib/recaptcha.ts
type RecaptchaResponse = {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (process.env.RECAPTCHA_DISABLE === "true") {
    console.warn("[recaptcha] Bypassed (RECAPTCHA_DISABLE=true)");
    return true;
  }

  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) {
    console.warn("[recaptcha] Missing RECAPTCHA_SECRET");
    return false;
  }

  const endpoints = [
    "https://www.google.com/recaptcha/api/siteverify",
    "https://recaptcha.google.com/recaptcha/api/siteverify",
    "https://www.recaptcha.net/recaptcha/api/siteverify",
  ] as const;

  const body = new URLSearchParams({ secret, response: token }).toString();

  let lastErr: any = null;
  for (const url of endpoints) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      });

      clearTimeout(t);

      // Only parse JSON on 200s; other statuses can return HTML
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[recaptcha] ${url} status=${res.status} body=${text.slice(0, 120)}`);
        lastErr = new Error(`HTTP_${res.status}`);
        continue;
      }

      const data = (await res.json().catch(() => ({}))) as RecaptchaResponse;

      if (!data?.success) {
        console.warn("[recaptcha] Failed JSON:", data);
        lastErr = new Error((data["error-codes"] || []).join(",") || "recaptcha_failed");
        continue;
      }

      // Accept v2 (no score), or v3 with score >= 0.3
      const ok = data.score == null || data.score >= 0.3;
      if (!ok) {
        console.warn("[recaptcha] Low score:", data);
      }
      return ok;
    } catch (e: any) {
      clearTimeout(t);
      const msg = e?.name === "AbortError" ? "timeout" : e?.message || e;
      console.warn(`[recaptcha] ${url} fetch error: ${msg}`);
      lastErr = e;
      continue;
    }
  }

  console.error("[recaptcha] All attempts failed:", lastErr?.message || lastErr);
  return false;
}