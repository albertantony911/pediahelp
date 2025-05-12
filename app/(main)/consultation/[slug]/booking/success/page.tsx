'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { client as sanityClient } from '@/sanity/lib/client';
import Link from 'next/link';

interface BookingData {
  doctorName: string;
  date: string;
  time: string;
  parentName: string;
  patientName: string;
  email: string;
  phone: string;
  status: string;
}

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function fetchBooking() {
      try {
        const result = await sanityClient.fetch(
          `*[_type == "booking" && _id == $id][0] {
            doctorName,
            date,
            time,
            parentName,
            patientName,
            email,
            phone,
            status
          }`,
          { id: `booking-${token}` }
        );

        if (result) {
          setBooking(result);
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [token]);

  if (!token) {
    return <p className="text-destructive text-center mt-10">Invalid booking token.</p>;
  }

  if (loading) {
    return <p className="text-center mt-10">Loading booking details...</p>;
  }

  if (!booking) {
    return <p className="text-center mt-10">Booking not found.</p>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card>
        <CardHeader className="flex flex-col items-center">
          <CheckCircle2 className="w-10 h-10 text-green-600 mb-2" />
          <CardTitle className="text-center">Booking Confirmed</CardTitle>
          <Badge className="mt-2 text-sm">{booking.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p><strong>Doctor:</strong> {booking.doctorName}</p>
          <p><strong>Date:</strong> {booking.date}</p>
          <p><strong>Time:</strong> {booking.time}</p>
          <p><strong>Parent Name:</strong> {booking.parentName}</p>
          <p><strong>Child Name:</strong> {booking.patientName}</p>
          <p><strong>Email:</strong> {booking.email}</p>
          <p><strong>Phone:</strong> {booking.phone}</p>

          <div className="pt-6 space-y-4">
            <Button className="w-full" variant="outline" asChild>
              <a
                href={`https://wa.me/91${booking.phone.replace('+91', '')}?text=${encodeURIComponent(
                  `Hi ${booking.parentName}, your appointment with ${booking.doctorName} is confirmed on ${booking.date} at ${booking.time}. \nThank you for using PediaHelp.`
                )}`}
                target="_blank"
              >
                Send Confirmation via WhatsApp
              </a>
            </Button>

            <div className="flex gap-4 pt-2">
              <Button asChild className="w-full" variant="secondary">
                <Link href="/">Return to Home</Link>
              </Button>
              <Button asChild className="w-full" variant="default">
                <Link href="/consultation">Book Another Appointment</Link>
              </Button>
            </div>

            {/* Optional: send email confirmation later */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
