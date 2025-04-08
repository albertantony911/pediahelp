import { NextRequest, NextResponse } from 'next/server'
import { groq } from 'next-sanity'
import { createClient } from 'next-sanity'

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>()
const RATE_LIMIT = 5
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
  console.error('❌ Missing required Sanity env variables')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-10-18',
  useCdn: false,
  token,
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()

  // Rate limit
  const rateData = rateLimitMap.get(ip) || { count: 0, lastRequest: now }

  if (now - rateData.lastRequest > RATE_LIMIT_WINDOW) {
    rateData.count = 0
    rateData.lastRequest = now
  }

  if (rateData.count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  rateData.count += 1
  rateLimitMap.set(ip, rateData)

  // Parse body
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, rating, comment, doctorId } = body

  if (!name || !rating || !comment || !doctorId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check doctor
  try {
    const doctor = await client.fetch(
      groq`*[_type == "doctor" && _id == $id][0]`,
      { id: doctorId }
    )

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }
  } catch (err) {
    console.error('🔴 Error checking doctor existence:', err)
    return NextResponse.json({ error: 'Could not validate doctor' }, { status: 500 })
  }

  // Submit review
  try {
    const review = {
      _type: 'review',
      name,
      rating,
      comment,
      doctor: {
        _type: 'reference',
        _ref: doctorId,
      },
      approved: true,
      submittedAt: new Date().toISOString(),
    }

    const result = await client.create(review)

    return NextResponse.json({ success: true, id: result._id })
  } catch (error: any) {
    console.error('🔴 Failed to submit review:', error)

    if (error.statusCode === 403) {
      return NextResponse.json(
        { error: 'Unauthorized to write. Check SANITY_API_TOKEN.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ error: 'Review submission failed' }, { status: 500 })
  }
}