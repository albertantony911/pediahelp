export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { createRoomOrReuse } from '@/lib/daily';
import crypto from 'crypto';

function yyyymmddhhmm(dateIso: string) {
  const d = new Date(dateIso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    // Fetch booking with doctor + slot
    const booking = await client.fetch(
      `*[_type=="booking" && _id==$bookingId][0]{
        _id, slot, status, patientName, childName, email,
        doctor->{ _id, name }
      }`, { bookingId }
    );

    if (!booking) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    // You can require booking.status === 'paid' if you want.
    const startMs = new Date(booking.slot).getTime();
    const endMs = startMs + 45 * 60 * 1000; // 45 min session (tune)

    // Stable-ish room name (doctor + yyyyMMddHHmm) but still unique per slot
    const safeDoc = (booking.doctor?.name || 'doctor').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const roomName = `${safeDoc}-${yyyymmddhhmm(booking.slot)}`;

    // Create/reuse Daily room
    await createRoomOrReuse({ roomName, startMs, endMs });

    // Create a new inviteId (opaque)
    const inviteId = crypto.randomBytes(10).toString('base64url');

    // Persist on booking
    await client.patch(bookingId).set({
      meeting: {
        _type: 'meetingInfo',
        inviteId,
        roomName,
        startsAt: new Date(startMs).toISOString(),
        endsAt: new Date(endMs).toISOString(),
        status: 'active',
      }
    }).commit();

    // Build the branded invite link
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteUrl = `${base}/heimdall/meet/i/${inviteId}`;

    return NextResponse.json({
      ok: true,
      bookingId,
      inviteId,
      roomName,
      inviteUrl,
      startsAt: new Date(startMs).toISOString(),
      endsAt: new Date(endMs).toISOString(),
    });
  } catch (e: any) {
    console.error('[meet/create] error:', e?.message || e);
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}