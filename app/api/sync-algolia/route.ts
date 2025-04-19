import { NextRequest, NextResponse } from 'next/server';
import { syncDoctorsToAlgolia } from '@/lib/syncDoctorsToAlgolia';
import { syncPostsToAlgolia } from '@/lib/syncPostsToAlgolia';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const type = body?._type;

    if (type === 'doctor') {
      console.log('👨‍⚕️ Syncing DOCTORS...');
      await syncDoctorsToAlgolia();
    } else if (type === 'post') {
      console.log('📝 Syncing POSTS...');
      await syncPostsToAlgolia();
    } else {
      console.log('⚠️ Unrecognized _type or missing body:', body);
      return new NextResponse('Unknown _type received', { status: 400 });
    }

    return NextResponse.json({ message: `Sync completed for type: ${type}` });
  } catch (err) {
    console.error('❌ Sync failed:', err);
    return new NextResponse('Sync failed', { status: 500 });
  }
}