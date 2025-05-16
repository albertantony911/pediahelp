'use client';

import { Button } from '@sanity/ui';
import { useToast } from '@sanity/ui';
import { Spinner } from '@sanity/ui';
import { useState } from 'react';

export function CancelBookingAction({
  id,
  type,
  published,
}: {
  id: string;
  type: string;
  published: any;
}) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/heimdall/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: published._id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Unknown error');

      toast.push({
        status: 'success',
        title: 'Booking Cancelled',
        description: data.message,
      });
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'Cancellation Failed',
        description: (err as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      tone="critical"
      disabled={isLoading}
      onClick={handleCancel}
      text={isLoading ? <Spinner muted /> : 'Cancel Booking'}
    />
  );
}

CancelBookingAction.action = {
  name: 'cancel-booking',
  label: 'Cancel Booking',
  component: CancelBookingAction,
};