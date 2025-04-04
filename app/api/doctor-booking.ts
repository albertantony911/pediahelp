import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get('slug');

  if (!slug || typeof slug !== 'string') {
    console.log('Invalid slug:', slug);
    return NextResponse.json({ error: 'Missing or invalid slug' }, { status: 400 });
  }

  try {
    console.log('Fetching doctor with slug:', slug);
    const doctor = await client.fetch(
      groq`*[_type == "doctor" && slug.current == $slug][0]{ bookingId, slug }`,
      { slug }
    );

    console.log('Fetched doctor:', doctor);

    if (!doctor || !doctor.bookingId) {
      console.log('No doctor or bookingId found for slug:', slug);
      return NextResponse.json({ error: 'Booking link not found' }, { status: 404 });
    }

    // Extract the bookingId from the zcal URL (e.g., "https://zcal.co/i/lEUflsDO" -> "lEUflsDO")
    const bookingIdMatch = doctor.bookingId.match(/\/i\/([a-zA-Z0-9]+)$/);
    if (!bookingIdMatch || !bookingIdMatch[1]) {
      console.log('Invalid zcal URL format:', doctor.bookingId);
      return NextResponse.json({ error: 'Invalid booking URL format' }, { status: 400 });
    }
    const bookingId = bookingIdMatch[1];

    return NextResponse.json({ bookingId }, { status: 200 });
  } catch (err) {
    console.error('Error fetching bookingId:', err.message, err.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}