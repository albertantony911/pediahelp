import { NextRequest, NextResponse } from 'next/server';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';

import { syncPostsToAlgolia, fullSyncPostsToAlgolia } from '@/lib/syncPostsToAlgolia';
import { syncDoctorsToAlgolia, fullSyncDoctorsToAlgolia } from '@/lib/syncDoctorsToAlgolia';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? '';

  const valid = await isValidSignature(payload, signature, process.env.SANITY_WEBHOOK_SECRET!);
  if (!valid) {
    console.error('⚠️ Invalid webhook signature');
    return new NextResponse('Invalid signature', { status: 401 });
  }

  const data = JSON.parse(payload) as {
    _type: string;
    operation: 'create' | 'update' | 'delete';
    document: any;
    _id: string;
  };

  try {
    switch (data._type) {
      case 'post':
        await syncPostsToAlgolia(data);
        break;
      case 'doctor':
        await syncDoctorsToAlgolia(data);
        break;
      default:
        console.warn('🛑 Unsupported _type:', data._type);
        return new NextResponse('Unknown type', { status: 400 });
    }

    return NextResponse.json({ message: `${data._type} sync complete` });
  } catch (error) {
    console.error(`❌ Error syncing ${data._type}:`, error);
    return new NextResponse('Sync failed', { status: 500 });
  }
}

// Optional full sync: triggers syncing all types manually
export async function GET() {
  try {
    await fullSyncPostsToAlgolia();
    await fullSyncDoctorsToAlgolia();
    return NextResponse.json({ message: 'Full sync complete for posts and doctors' });
  } catch (error) {
    console.error('❌ Full sync failed:', error);
    return new NextResponse('Full sync failed', { status: 500 });
  }
}