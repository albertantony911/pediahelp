// Refactored StepSuccess.tsx
'use client';

import { useBookingStore } from '@/store/bookingStore';
import { Button } from '@/components/ui/button';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function StepSuccess() {
  const {
    selectedDoctor,
    selectedSlot,
    confirmedBookingId,
    reset,
  } = useBookingStore();

  const [notified, setNotified] = useState(false);

  const formattedDate = selectedSlot
    ? format(new Date(selectedSlot), "EEE, MMM d yyyy 'at' h:mm a")
    : '';

  useEffect(() => {
    const notify = async () => {
      if (!confirmedBookingId || notified) return;

      try {
        const res = await fetch('/api/heimdall/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: confirmedBookingId }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          toast.success('Confirmation sent via Email, SMS, WhatsApp');
        } else {
          toast.warning('Booking succeeded, but notification failed');
        }
      } catch (err) {
        toast.error('Notification error');
      }

      setNotified(true);
    };

    notify();
  }, [confirmedBookingId, notified]);

  const handleDownloadICS = () => {
    if (!selectedDoctor || !selectedSlot) return;

    const title = `Appointment with ${selectedDoctor.name}`;
    const start = new Date(selectedSlot).toISOString().replace(/[-:]|\.\d{3}/g, '');
    const end = new Date(new Date(selectedSlot).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]|\.\d{3}/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Appointment via PediaHelp`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointment.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="text-center space-y-6 animate-in fade-in duration-700">
      <CheckCircle2 className="mx-auto text-green-600 w-16 h-16" />
      <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
      <p className="text-muted-foreground">We’ve sent a confirmation to your email and phone.</p>

      {selectedDoctor && selectedSlot && (
        <div className="bg-muted border rounded-xl p-4 text-left max-w-md mx-auto">
          <div className="flex gap-4 items-center">
            {selectedDoctor.photo?.asset?.url && (
              <img
                src={selectedDoctor.photo.asset.url}
                alt={selectedDoctor.name}
                className="w-14 h-14 object-cover rounded-full border"
              />
            )}
            <div>
              <div className="font-medium text-lg">{selectedDoctor.name}</div>
              <div className="text-sm text-muted-foreground">{formattedDate}</div>
              <div className="text-sm font-semibold mt-1">Fee: ₹{selectedDoctor.appointmentFee}</div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 flex items-center justify-center gap-2"
            onClick={handleDownloadICS}
          >
            <CalendarDays className="w-4 h-4" />
            Add to Calendar
          </Button>
        </div>
      )}

      <Button onClick={reset}>Book Another Appointment</Button>
    </div>
  );
}
