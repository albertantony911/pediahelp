import { kv } from './kv';

/** Simple windowed rate limit: INCR + EXPIRE */
export async function bumpRateOrThrow(key: string, windowSec: number, maxHits: number) {
  const k = `rl:${key}`;
  const tx = kv.multi();
  tx.incr(k);
  tx.expire(k, windowSec);
  const [count] = (await tx.exec()) as [number, unknown];
  if (count > maxHits) throw new Error('RATE_LIMITED');
}