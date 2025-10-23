// app/api/payment/razorpay-webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { client } from '@/sanity/lib/client';

/**
 * IMPORTANT:
 * - Set RAZORPAY_WEBHOOK_SECRET in your env (this is the secret you configured on Razorpay's Dashboard > Webhooks).
 * - We verify the raw body with X-Razorpay-Signature header.
 * - This handler is idempotent: if the booking is already paid, we no-op and return 200.
 */

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    if (!webhookSecret) {
      console.error('[webhook] Missing RAZORPAY_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    }

    // 1) Read raw body for signature verification
    const rawBody = await req.text();
    const sigHeader = req.headers.get('x-razorpay-signature') || '';

    const digest = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (digest !== sigHeader) {
      console.warn('[webhook] Signature mismatch');
      return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
    }

    // 2) Parse event
    const event = JSON.parse(rawBody);
    const type: string = event?.event;
    // We’ll handle both `payment.captured` and `order.paid`
    const paymentEntity = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;

    // Resolve Razorpay order_id from either event shape
    const orderId: string | undefined =
      paymentEntity?.order_id || orderEntity?.id || orderEntity?.entity?.id;

    if (!orderId) {
      // Nothing we can do; acknowledge to avoid retries.
      console.warn('[webhook] Missing order_id in event');
      return NextResponse.json({ ok: true, ignored: true });
    }

    // 3) Find the corresponding booking by order id (we stored this in /api/payment/pay)
    const booking = await client.fetch(
      `*[_type == "booking" && razorpayOrderId == $orderId][0]{
        _id, status, slot, email, phone, patientName, childName,
        doctor->{ name, email, whatsappNumber },
        meeting { inviteId }
      }`,
      { orderId }
    );

    if (!booking) {
      console.warn('[webhook] No booking found for order:', orderId);
      // Acknowledge to prevent Razorpay retries; you can log for later reconciliation.
      return NextResponse.json({ ok: true, ignored: true });
    }

    // 4) If already paid, no-op (idempotent)
    if (booking.status === 'paid' || booking.status === 'confirmed') {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    // We only care about final payment success events
    const successLike = type === 'payment.captured' || type === 'order.paid';
    if (!successLike) {
      // Not a success event; acknowledge to avoid retries.
      return NextResponse.json({ ok: true, ignored: true });
    }

    const razorpayPaymentId: string | undefined = paymentEntity?.id;

    // 5) Mark booking as paid
    await client
      .patch(booking._id)
      .set({
        status: 'paid',
        razorpayPaymentId: razorpayPaymentId || null,
        paidAt: new Date().toISOString(),
      })
      .commit();

    // 6) Create meeting (if not created yet)
    let inviteId: string | undefined = booking?.meeting?.inviteId;
    try {
      if (!inviteId) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/heimdall/meet/create`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: booking._id }),
          }
        );
        const j = await res.json().catch(() => ({}));
        inviteId = j?.inviteId;
        if (inviteId) {
          await client.patch(booking._id).set({ meeting: { inviteId } }).commit();
        }
      }
    } catch (meetErr) {
      console.error('[webhook] meeting create failed (will still notify):', meetErr);
    }

    // 7) Trigger notifications (will compute join links from inviteId)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/heimdall/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking._id }),
      });
    } catch (notifyErr) {
      console.error('[webhook] notify failed:', notifyErr);
      // Still acknowledge the webhook; notification retries can be handled later if needed.
    }

    return NextResponse.json({ ok: true, processed: true, inviteId: inviteId || null });
  } catch (err) {
    console.error('[webhook] error:', err);
    // Return 200 so Razorpay doesn’t keep retrying forever if this was a non-deterministic error.
    // If you want retries, return 500 instead.
    return NextResponse.json({ ok: false, swallowed: true });
  }
}