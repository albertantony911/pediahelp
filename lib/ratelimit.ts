import { db } from './firebase-admin';
import { nowSec } from './crypto';

export async function bumpRateOrThrow(key: string, windowSec: number, maxHits: number) {
  const ref = db.collection('rate').doc(key);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const now = nowSec(), start = now - windowSec;
    let ts: number[] = snap.exists ? (snap.data()!.timestamps || []) : [];
    ts = ts.filter(t => t >= start);
    if (ts.length >= maxHits) throw new Error('RATE_LIMITED');
    ts.push(now);
    tx.set(ref, { timestamps: ts }, { merge: true });
  });
}