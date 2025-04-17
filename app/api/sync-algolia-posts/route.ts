import { NextRequest, NextResponse } from 'next/server';
import { syncPostsToAlgolia } from '@/lib/syncPostsToAlgolia';

export async function POST(req: NextRequest) {
  try {
    await syncPostsToAlgolia();
    return NextResponse.json({ message: 'Blog sync complete.' });
  } catch (err) {
    console.error('❌ Blog sync error:', err);
    return new NextResponse('Sync failed', { status: 500 });
  }
}