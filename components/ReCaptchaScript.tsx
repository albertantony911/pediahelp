'use client';

import Script from 'next/script';

export default function ReCaptchaScripts() {
  return (
    <>
      {/* Enterprise v2 invisible for form token */}
      <Script
        src={`https://www.google.com/recaptcha/enterprise.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_V2_KEY}`}
        strategy="afterInteractive"
        onLoad={() => console.log('reCAPTCHA Enterprise v2 loaded')}
        onError={(e) => console.error('Failed to load reCAPTCHA Enterprise v2', e)}
      />

      {/* Standard v3 for Firebase App Check */}
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_V3_KEY}`}
        strategy="afterInteractive"
        onLoad={() => {
          window.grecaptcha?.ready(() => {
            console.log('reCAPTCHA v3 ready for Firebase App Check');
          });
        }}
        onError={(e) => console.error('Failed to load reCAPTCHA v3', e)}
      />
    </>
  );
}