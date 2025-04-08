// app/api/review/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { groq } from 'next-sanity'
import { createClient } from 'next-sanity'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-10-18',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, rating, comment, doctorId } = body

  if (!name || !rating || !comment || !doctorId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch doctor and slug
  const doctor = await client.fetch(
    groq`*[_type == "doctor" && _id == $id][0]{ slug }`,
    { id: doctorId }
  )

  if (!doctor || !doctor.slug?.current) {
    return NextResponse.json({ error: 'Doctor not found or missing slug' }, { status: 404 })
  }

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

    // 🔁 Revalidate doctor profile by slug
    const slug = doctor.slug.current
    const revalidateRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=/doctors/${slug}&secret=${process.env.REVALIDATE_SECRET_TOKEN}`
    )

    if (!revalidateRes.ok) {
      console.warn('❗ Revalidation failed:', await revalidateRes.text())
    }

    return NextResponse.json({ success: true, id: result._id })
  } catch (error: any) {
    console.error('🔴 Failed to submit review:', error)

    return NextResponse.json(
      { error: error.message || 'Review submission failed' },
      { status: 500 }
    )
  }
}