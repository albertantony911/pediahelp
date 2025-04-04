"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FailedPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  // Generate a temporary payment link (you'll implement this in the next step)
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