// /app/api/blog-comments/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyApprovalToken } from '@/lib/approval';
import { client } from '@/sanity/lib/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const token = searchParams.get('token');

    if (!id || !token) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    const ok = verifyApprovalToken(token, id, 'blogComment.approve');
    if (!ok) {
      return NextResponse.json({ error: 'invalid_or_expired' }, { status: 400 });
    }

    // Patch document
    await client
      .patch(id)
      .set({ approved: true, approvedAt: new Date().toISOString() })
      .commit();

    // Redirect to a friendly page (Studio, or a success page)
    const redirectTo =
      process.env.NEXT_PUBLIC_STUDIO_URL ||
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/sanity`;
    return NextResponse.redirect(redirectTo, { status: 302 });
  } catch (e: any) {
    return NextResponse.json({ error: 'approve_failed' }, { status: 500 });
  }
}