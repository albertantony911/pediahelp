// lib/kv.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

/** Expose only what we use today. Add getters/setters later if needed. */
export const kv = {
  multi() {
    return redis.pipeline(); // provides incr, expire, exec, etc.
  },
  // Useful utilities if you need them elsewhere
  incr: (key: string) => redis.incr(key),
  expire: (key: string, ttl: number) => redis.expire(key, ttl),
  get: <T = unknown>(key: string) => redis.get<T>(key),
  set: (key: string, value: unknown, opts?: { ex?: number }) => {
    if (opts?.ex !== undefined) {
      return redis.set(key, value, { ex: opts.ex });
    }
    return redis.set(key, value);
  },
  del: (key: string) => redis.del(key),
};