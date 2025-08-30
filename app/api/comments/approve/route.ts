// app/api/comments/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { client } from '@/sanity/lib/client';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') || '';
    const sig = req.nextUrl.searchParams.get('sig') || '';
    const secret = process.env.COMMENT_APPROVE_SECRET!;
    if (!token || !sig || !secret) return NextResponse.json({ ok: false }, { status: 400 });

    const json = Buffer.from(token, 'base64url').toString('utf8');
    const expected = crypto.createHmac('sha256', secret).update(json).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ ok: false, error: 'bad_sig' }, { status: 401 });
    }

    const { id, slug } = JSON.parse(json) as { id: string; slug: string };

    await client.patch(id).set({ approved: true, approvedAt: new Date().toISOString() }).commit();
    revalidatePath(`/blog/${slug}`);

    const site = process.env.NEXT_PUBLIC_SITE_URL || '';
    return NextResponse.redirect(`${site}/blog/${slug}?approved=1`, 302);
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}