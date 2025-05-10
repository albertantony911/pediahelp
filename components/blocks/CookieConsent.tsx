'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';

const COOKIE_CONSENT_KEY = 'pedia_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasConsent = Cookies.get(COOKIE_CONSENT_KEY);
    if (!hasConsent) {
      setVisible(true);
    }

    // Allow external triggering from window.resetCookieConsent()
    if (typeof window !== 'undefined') {
      (window as any).resetCookieConsent = () => {
        Cookies.remove(COOKIE_CONSENT_KEY);
        setVisible(true);
      };
    }
  }, []);

  const handleAccept = () => {
    Cookies.set(COOKIE_CONSENT_KEY, 'true', { expires: 365 });
    setVisible(false);
  };

  const handleDecline = () => {
    Cookies.set(COOKIE_CONSENT_KEY, 'false', { expires: 365 });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-background border-t border-border p-4 z-50">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
        <p>
          We use cookies to improve your experience. By continuing, you agree to our privacy policy.
        </p>
        <div className="flex gap-2">
          <Button onClick={handleAccept} size="sm">Accept</Button>
          <Button onClick={handleDecline} size="sm" variant="outline">Decline</Button>
        </div>
      </div>
    </div>
  );
}