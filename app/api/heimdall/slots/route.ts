import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/heimdall-engine/availability';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get('doctorId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!doctorId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots({ doctorId, startDate, endDate });
    return NextResponse.json({ slots });
  } catch (err) {
    console.error('Slot fetching error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}