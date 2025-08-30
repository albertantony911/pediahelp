// /app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.searchParams.get('postId');
    if (!postId) return NextResponse.json({ comments: [] });

    const query = `
      *[_type=="blogComment" && defined(post._ref) && post._ref==$postId && approved==true]
        | order(submittedAt desc){
          _id, name, question, submittedAt
        }
    `;
    const comments = await client.fetch(query, { postId });
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}