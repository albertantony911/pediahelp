import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)  // Ensures we get the correct URL object
  const secret = url.searchParams.get('secret')
  const path = url.searchParams.get('path')

  // Check if the secret token matches
  if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }

  // Ensure the path is provided
  if (!path) {
    return NextResponse.json({ message: 'Missing path' }, { status: 400 })
  }

  try {
    // Revalidate the path dynamically
    await revalidatePath(path)

    return NextResponse.json({ revalidated: true, path })
  } catch (err) {
    console.error('Revalidation error:', err)
    return NextResponse.json({ message: 'Revalidation failed', error: err }, { status: 500 })
  }
}