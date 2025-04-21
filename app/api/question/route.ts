// app/api/question/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { groq } from 'next-sanity';
import { createClient } from 'next-sanity';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-10-18',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, question, slug } = body;

  if (!name || !email || !phone || !question || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const blog = await client.fetch(
    groq`*[_type == "post" && slug.current == $slug][0]{ _id, title }`,
    { slug }
  );

  if (!blog || !blog._id) {
    return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
  }

  try {
    const doc = {
      _type: 'comment',
      name,
      email,
      phone,
      question,
      approved: false,
      submittedAt: new Date().toISOString(),
      blog: {
        _type: 'reference',
        _ref: blog._id,
      },
    };

    const result = await client.create(doc);

    // Optional: Trigger revalidation
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=/blog/${slug}&secret=${process.env.REVALIDATE_SECRET_TOKEN}`);

    // TODO: Add email + WhatsApp integrations here
    return NextResponse.json({ success: true, id: result._id });
  } catch (error: any) {
    console.error('[Question] Submission failed:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}