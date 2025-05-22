// app/api/sync-algolia/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { syncPostsToAlgolia, fullSyncPostsToAlgolia } from '@/lib/syncPostsToAlgolia';

export async function POST(request: NextRequest) {
  // 1. Grab raw payload & signature header
  const payload = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? '';

  // 2. Validate HMAC
  const valid = await isValidSignature(
    payload,
    signature,
    process.env.SANITY_WEBHOOK_SECRET!
  );
  if (!valid) {
    console.error('⚠️ Invalid webhook signature');
    return new NextResponse('Invalid signature', { status: 401 });
  }

  // 3. Parse & dispatch to your sync function
  const data = JSON.parse(payload) as {
    _type: string;
    operation: 'create' | 'update' | 'delete';
    document: any;
    _id: string;
  };

  if (data._type === 'post') {
    await syncPostsToAlgolia({
      _id: data._id,
      _type: data._type,
      operation: data.operation,
      document: data.document,
    });
  } else {
    console.warn('🛑 Unsupported _type:', data._type);
    return new NextResponse('Unknown type', { status: 400 });
  }

  return NextResponse.json({ message: 'Post sync complete' });
}

export async function GET() {
  // No “request” param here—avoids “unused” warnings
  await fullSyncPostsToAlgolia();
  return NextResponse.json({ message: 'Full posts sync complete' });
}