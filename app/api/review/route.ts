import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';

// Simple in-memory rate limiting (for demonstration purposes)
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT = 5; // Max 5 requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour window

export async function POST(req: NextRequest) {
  // Get the client's IP address (or phone number for better tracking)
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const body = await req.json();
  const { name, rating, comment, doctorId } = body;

  // Rate limiting logic
  const now = Date.now();
  const rateLimitData = rateLimitMap.get(ip) || { count: 0, lastRequest: now };

  if (now - rateLimitData.lastRequest > RATE_LIMIT_WINDOW) {
    // Reset the counter if the window has expired
    rateLimitData.count = 0;
    rateLimitData.lastRequest = now;
  }

  if (rateLimitData.count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  rateLimitData.count += 1;
  rateLimitMap.set(ip, rateLimitData);

  // Validate request body
  if (!name || !rating || !comment || !doctorId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Validate that the doctorId corresponds to an existing doctor
  const doctorExists = await client.fetch(
    groq`*[_type == "doctor" && _id == $id][0]`,
    { id: doctorId }
  );

  if (!doctorExists) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  try {
    // Check if the client has a token (for debugging)
    if (!process.env.SANITY_API_TOKEN) {
      throw new Error('Sanity API token is not configured. Mutations are not allowed.');
    }

    // Create the review document
    const review = {
      _type: 'review',
      name,
      rating,
      comment,
      doctor: {
        _type: 'reference',
        _ref: doctorId,
      },
      approved: true, // auto-publish
      submittedAt: new Date().toISOString(),
    };

    // Ensure we're only creating a review document
    if (review._type !== 'review') {
      throw new Error('Invalid document type. Only "review" documents can be created.');
    }

    await client.create(review);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Review submission error:', error);
    if (error.statusCode === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create a review. Please contact support.' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}