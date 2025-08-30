// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { getSession, markUsed } from '@/lib/otp-store-redis';
import { nowSec } from '@/lib/crypto';
import { sendBlogCommentNotification } from '@/lib/mailer';

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId') || '';
  if (!postId) return NextResponse.json({ comments: [] });

  const comments = await client.fetch(
    `*[_type == "blogComment" && post._ref == $postId && approved == true]
      | order(submittedAt desc){
        _id, name, "comment": question, submittedAt
      }`,
    { postId }
  );

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, slug, name, email, phone, question } = body || {};

    if (!sessionId || !slug || !name || !email || !phone || !question) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    const s = await getSession(sessionId);
    if (!s)                       return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
    if (s.expiresAt < nowSec())   return NextResponse.json({ error: 'expired' }, { status: 400 });
    if (!s.verified)              return NextResponse.json({ error: 'not_verified' }, { status: 400 });
    if (s.used)                   return NextResponse.json({ error: 'already_used' }, { status: 400 });
    if (s.scope !== 'blog-comment') return NextResponse.json({ error: 'wrong_scope' }, { status: 403 });

    const post = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]{ _id, title }`,
      { slug }
    );
    if (!post?._id) return NextResponse.json({ error: 'post_not_found' }, { status: 404 });

    const doc = await client.create({
      _type: 'blogComment',
      post: { _type: 'reference', _ref: post._id },
      name,
      email,
      phone,
      question,
      approved: false,
      submittedAt: new Date().toISOString(),
    });

    await markUsed(sessionId);

const notifyTo = process.env.NOTIFY_TO || process.env.RESEND_REPLY_TO || process.env.RESEND_FROM;
if (notifyTo) {
  await sendBlogCommentNotification(notifyTo, {
    commentId: doc._id,
    slug,
    postTitle: post.title || slug,
    name,
    email,
    phone,
    question,
  });
}

    return NextResponse.json({ ok: true, id: doc._id });
  } catch (e: any) {
    console.error('[comments] error:', e?.message || e);
    return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
  }
}