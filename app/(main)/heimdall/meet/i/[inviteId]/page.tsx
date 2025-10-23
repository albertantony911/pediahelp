'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Script from 'next/script';

type TokenResp = { token?: string; roomUrl?: string; error?: string };

export default function MeetJoinPage() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const q = useSearchParams();
  const who = (q.get('who') || 'patient') as 'doctor'|'patient';
  const name = q.get('name') || (who === 'doctor' ? 'Doctor' : 'Guest');

  const mountRef = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let frame: any;
    let cancelled = false;

    async function run() {
      try {
        if (!inviteId) return;
        setLoading(true);

        const res = await fetch(
          `/api/heimdall/meet/token?inviteId=${encodeURIComponent(inviteId)}&who=${who}&name=${encodeURIComponent(name)}`,
          { cache: 'no-store' }
        );
        const data: TokenResp = await res.json();
        if (!res.ok || !data.token || !data.roomUrl) {
          setErr(data.error || 'Unable to join meeting.');
          setLoading(false);
          return;
        }

        // Load Daily script if not already present
        // @ts-ignore
        const DailyIframe = (window as any).DailyIframe;
        if (!DailyIframe) {
          setErr('Video library not loaded.');
          setLoading(false);
          return;
        }

        if (cancelled) return;

        // Prebuilt iframe
        const root = mountRef.current!;
        frame = DailyIframe.createFrame(root, {
          showLeaveButton: true,
          // Aesthetic choices to match your glass UI
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '16px',
            boxShadow: '0 20px 80px -24px rgba(0,0,0,0.45)',
            background: 'transparent',
          },
          theme: {
            colors: {
              accent: '#14b8a6', // teal
            },
          },
        });

        await frame.join({ url: data.roomUrl, token: data.token });

        setLoading(false);
      } catch (e: any) {
        setErr(e?.message || 'Join failed');
        setLoading(false);
      }
    }
    run();

    return () => {
      cancelled = true;
      try { frame?.leave?.(); frame?.destroy?.(); } catch {}
    };
  }, [inviteId, who, name]);

  return (
    <>
      {/* Daily Prebuilt loader */}
      <Script src="https://unpkg.com/@daily-co/daily-js" strategy="afterInteractive" />

      {/* Background wash to match your aesthetic */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 opacity-80"
        style={{
          background:
            'radial-gradient(62rem 62rem at 18% -12%, rgba(202,215,110,0.18), transparent 60%), ' +
            'radial-gradient(52rem 52rem at 90% 10%, rgba(28,148,123,0.20), transparent 60%)',
        }}
      />

      <main className="min-h-screen px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Header strip */}
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl px-4 py-3 text-white">
            <div className="text-sm sm:text-base">
              <span className="opacity-80">Secure Tele-consult:</span>{' '}
              <span className="font-semibold uppercase">{who === 'doctor' ? 'Doctor' : 'Patient'}</span>
            </div>
            <div className="text-xs sm:text-sm opacity-80">Powered by Daily</div>
          </div>

          {/* Call container */}
          <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_12px_60px_-18px_rgba(0,0,0,0.35)] overflow-hidden">
            <div ref={mountRef} style={{ height: '78vh' }} className="w-full" />
          </div>

          {/* Status / Error */}
          {(loading || err) && (
            <div className="mt-3 text-center text-white">
              {loading ? <span className="opacity-80 text-sm">Preparing your secure room…</span> :
               <span className="text-red-200 text-sm">{err}</span>}
            </div>
          )}
        </div>
      </main>
    </>
  );
}