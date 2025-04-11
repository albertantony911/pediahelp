// app/api/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { groq } from 'next-sanity';
import { createClient } from 'next-sanity';
import { calculateAverageRating } from '@/lib/ratingUtils'; // Import utility

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-10-18',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, rating, comment, doctorId } = body;

  if (!name || !rating || !comment || !doctorId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate rating (assuming 1-5 scale, adjust as needed)
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating value' }, { status: 400 });
  }

  // Fetch doctor and slug
  const doctor = await client.fetch(
    groq`*[_type == "doctor" && _id == $id][0]{ slug }`,
    { id: doctorId }
  );

  if (!doctor || !doctor.slug?.current) {
    return NextResponse.json({ error: 'Doctor not found or missing slug' }, { status: 404 });
  }

  try {
    // 1. Create the review document
    const review = {
      _type: 'review',
      name,
      rating,
      comment,
      doctor: {
        _type: 'reference',
        _ref: doctorId,
      },
      approved: true, // Note: You're setting approved: true immediately
      submittedAt: new Date().toISOString(),
    };

    const result = await client.create(review);

    // 2. Append review reference to doctor
    await client
      .patch(doctorId)
      .setIfMissing({ reviews: [] })
      .append('reviews', [{ _type: 'reference', _ref: result._id }])
      .commit();

    // 3. Calculate and update average rating
    const reviews = await client.fetch(
      groq`*[_type == "review" && doctor._ref == $id && approved == true]{ rating }`,
      { id: doctorId }
    );

    const averageRating = calculateAverageRating(reviews);

    await client
      .patch(doctorId)
      .set({ averageRating })
      .commit();

    // 4. Revalidate the doctor profile page
    const slug = doctor.slug.current;
    const revalidateRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=/consultation/${slug}&secret=${process.env.REVALIDATE_SECRET_TOKEN}`
    );

    if (!revalidateRes.ok) {
      console.warn('❗ Revalidation failed:', await revalidateRes.text());
    }

    return NextResponse.json({ success: true, id: result._id });
  } catch (error: any) {
    console.error('🔴 Failed to submit review:', error);
    return NextResponse.json(
      { error: error.message || 'Review submission failed' },
      { status: 500 }
    );
  }
}