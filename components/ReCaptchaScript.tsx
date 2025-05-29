'use client';

import Script from 'next/script';

export default function ReCaptchaScript() {
  return (
    <Script
      src={`https://www.google.com/recaptcha/enterprise.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_V3_KEY}`}
      strategy="afterInteractive"
      onError={(e) => console.error('Failed to load reCAPTCHA Enterprise v3 script:', e)}
      onLoad={() => {
        console.log('reCAPTCHA Enterprise v3 script loaded');
        window.grecaptcha?.enterprise?.ready(() => {
          console.log('reCAPTCHA Enterprise v3 ready');
        });
      }}
    />
  );
}