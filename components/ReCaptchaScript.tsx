'use client';

import Script from 'next/script';

export default function ReCaptchaScript() {
  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_V3_KEY}`}
      strategy="afterInteractive"
      onError={(e) => console.error('Failed to load reCAPTCHA v3:', e)}
      onLoad={() => console.log('reCAPTCHA v3 script loaded')}
    />
  );
}
