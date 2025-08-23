import { db } from './firebase-admin';
import { nowSec } from './crypto';

export async function bumpRateOrThrow(key: string, windowSec: number, maxHits: number, timeoutMs = 1200) {
  const ref = db.collection('rate').doc(key);

  const txPromise = db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const now = nowSec(), start = now - windowSec;
    let ts: number[] = snap.exists ? (snap.data()!.timestamps || []) : [];
    ts = ts.filter(t => t >= start);
    if (ts.length >= maxHits) throw new Error('RATE_LIMITED');
    ts.push(now);
    tx.set(ref, { timestamps: ts }, { merge: true });
  });

  // ⬇️ Cap the whole transaction; if it stalls, throw a special error
  return Promise.race([
    txPromise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('RATE_BACKEND_TIMEOUT')), timeoutMs)),
  ]);
}