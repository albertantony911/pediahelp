import { NextRequest, NextResponse } from 'next/server';
import { groq } from 'next-sanity';
import { createClient } from 'next-sanity';
import { calculateAverageRating } from '@/lib/ratingUtils';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_API_TOKEN',
  'NEXT_PUBLIC_SITE_URL',
  'REVALIDATE_SECRET_TOKEN',
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-10-18',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const now = Date.now();
    const requests = rateLimitMap.get(ip) || [];
    const recentRequests = requests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);

    const body = await req.json();
    const { name, rating, comment, doctorId, email, phone, subject } = body;

    // Validate required fields
    if (!name || !rating || !comment || !doctorId || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Phone number must be 10 digits' },
        { status: 400 }
      );
    }

    // Fetch doctor
    const doctor = await client.fetch(
      groq`*[_type == "doctor" && _id == $id][0]{ slug }`,
      { id: doctorId }
    );

    if (!doctor || !doctor.slug?.current) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Create review
    const review = {
      _type: 'review',
      name,
      rating,
      comment,
      email,
      phone,
      subject,
      doctor: {
        _type: 'reference',
        _ref: doctorId,
      },
      approved: true,
      submittedAt: new Date().toISOString(),
    };

    const result = await client.create(review);

    // Append review to doctor
    await client
      .patch(doctorId)
      .setIfMissing({ reviews: [] })
      .append('reviews', [{ _type: 'reference', _ref: result._id }])
      .commit();

    // Update average rating
    const reviews = await client.fetch(
      groq`*[_type == "review" && doctor._ref == $id && approved == true]{ rating }`,
      { id: doctorId }
    );

    const averageRating = calculateAverageRating(reviews);

    await client
      .patch(doctorId)
      .set({ averageRating })
      .commit();

    // Revalidate doctor page
    const slug = doctor.slug.current;
    await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=/consultation/${slug}&secret=${process.env.REVALIDATE_SECRET_TOKEN}`
    ).catch((err) => console.warn('⚠️ Revalidation failed:', err.message));

    return NextResponse.json({ success: true, id: result._id });
  } catch (error: any) {
    console.error('Failed to submit review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}