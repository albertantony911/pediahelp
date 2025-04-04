"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
      <p>Booking ID: {bookingId}</p>
      <p>Your booking has been confirmed.</p>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading confirmation...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
