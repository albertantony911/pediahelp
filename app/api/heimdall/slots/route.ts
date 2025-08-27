import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/heimdall-engine/availability';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const doctorId = url.searchParams.get('doctorId') || '';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';

  // Basic validation
  if (!doctorId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: doctorId, startDate, endDate' },
      { status: 400 }
    );
  }
  if (!ISO_DATE_RE.test(startDate) || !ISO_DATE_RE.test(endDate)) {
    return NextResponse.json(
      { error: 'Dates must be in YYYY-MM-DD format' },
      { status: 400 }
    );
  }

  // (Optional) clamp range to max 60 days to avoid huge queries
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const diffDays = Math.max(0, Math.ceil((+end - +start) / 86400000));
  if (diffDays > 60) {
    return NextResponse.json(
      { error: 'Date range too large (max 60 days)' },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots({ doctorId, startDate, endDate });
    // Always return a safe array
    return NextResponse.json({ slots: Array.isArray(slots) ? slots : [] }, {
      headers: {
        'Cache-Control': 'no-store',
        'x-debug-slots-count': String(Array.isArray(slots) ? slots.length : 0),
      },
    });
  } catch (err: any) {
    // Never 500 the client with a vague message—log details and return a safe empty set
    console.error('[slots] getAvailableSlots failed:', err?.stack || err);
    return NextResponse.json(
      { slots: [], error: 'slots_unavailable' },
      { status: 200, headers: { 'x-debug-error': 'true' } }
    );
  }
}