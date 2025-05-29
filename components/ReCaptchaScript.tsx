'use client';

import Script from 'next/script';

export default function ReCaptchaScript() {
  return (
    <>
      {/* 1) v3 for App Check */}
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_V3_KEY}`}
        strategy="afterInteractive"
        onError={(e) => console.error('Failed to load reCAPTCHA v3:', e)}
      />

      {/* 2) v2 Invisible for Phone-Auth */}
      <Script
        src="https://www.google.com/recaptcha/api.js"
        strategy="afterInteractive"
        onError={(e) => console.error('Failed to load reCAPTCHA v2:', e)}
      />
    </>
  );
}
