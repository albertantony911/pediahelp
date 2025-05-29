'use client';

import Script from 'next/script';

export default function ReCaptchaScript() {
  return (
    <Script
      src="https://www.google.com/recaptcha/api.js?render=explicit"
      strategy="afterInteractive"
      onError={(e) => {
        console.error('Failed to load reCAPTCHA script:', e);
      }}
      onLoad={() => {
        console.log('reCAPTCHA script loaded successfully');
      }}
    />
  );
}