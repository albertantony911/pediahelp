'use client';

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function FailedContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const tempPaymentLink = `/payment/retry?bookingId=${bookingId}&token=unique-token`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
      <p>Booking ID: {bookingId}</p>
      <p>Don’t worry, you can try again.</p>
      <Link href={tempPaymentLink} className="text-blue-500 underline">
        Retry Payment
      </Link>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <FailedContent />
    </Suspense>
  );
}
