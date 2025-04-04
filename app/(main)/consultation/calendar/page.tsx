'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUserInfo } from '@/lib/cookies';

interface UserInfo {
  parentName: string;
  patientName: string;
  email: string;
  phone: string;
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const userInfo = getUserInfo() as UserInfo | null;

  useEffect(() => {
    if (!bookingId) {
      console.error('No bookingId provided');
      return;
    }

    const zcalLink = `https://zcal.co/i/${bookingId}`;
    window.location.href = zcalLink;
  }, [bookingId]);

  if (!bookingId) {
    return <div>Error: No booking ID provided</div>;
  }

  return (
    <div>
      <h1>Redirecting to Calendar...</h1>
      {userInfo && (
        <p>
          Booking for <strong>{userInfo.patientName}</strong> by{' '}
          <strong>{userInfo.parentName}</strong>
        </p>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
