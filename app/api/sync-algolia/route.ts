import { NextRequest, NextResponse } from 'next/server';
import { syncDoctorsToAlgolia } from '@/lib/syncDoctorsToAlgolia';

export async function POST(req: NextRequest) {
  try {
    await syncDoctorsToAlgolia();
    return NextResponse.json({ message: 'Algolia sync complete.' });
  } catch (err) {
    console.error('❌ Sync error:', err);
    return new NextResponse('Sync failed', { status: 500 });
  }
}