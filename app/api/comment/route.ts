// app/api/comment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { groq } from 'next-sanity';
import { createClient } from 'next-sanity';
import { client } from '@/sanity/lib/client'; // for GET (read-only)
import { calculateAverageRating } from '@/lib/ratingUtils'; // optional

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-10-18',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, comment, postId } = body;

  if (!name || !comment || !postId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const post = await writeClient.fetch(
      groq`*[_type == "post" && _id == $id][0]{ slug, doctor-> { slug } }`,
      { id: postId }
    );

    if (!post || !post.slug?.current) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const newComment = {
      _type: 'comment',
      name,
      email,
      comment,
      approved: true,
      post: { _type: 'reference', _ref: postId },
      submittedAt: new Date().toISOString(),
    };

    const result = await writeClient.create(newComment);

    await writeClient
      .patch(postId)
      .setIfMissing({ comments: [] })
      .append('comments', [{ _type: 'reference', _ref: result._id }])
      .commit();

    const blogPath = post.doctor?.slug?.current
      ? `/blog/doctor/${post.doctor.slug.current}`
      : `/blog/${post.slug.current}`;

    const revalidateRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=${blogPath}&secret=${process.env.REVALIDATE_SECRET_TOKEN}`
    );

    if (!revalidateRes.ok) {
      console.warn('⚠️ Revalidation failed:', await revalidateRes.text());
    }

    return NextResponse.json({ success: true, id: result._id });
  } catch (error: any) {
    console.error('🔴 Failed to submit comment:', error);
    return NextResponse.json(
      { error: error.message || 'Comment submission failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId');

  if (!postId) {
    return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
  }

  try {
    const comments = await client.fetch(
      groq`*[_type == "comment" && post._ref == $id && approved == true] | order(submittedAt desc){
        _id, name, comment, submittedAt
      }`,
      { id: postId }
    );

    return NextResponse.json({ comments });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}