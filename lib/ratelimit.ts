import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env, hasRedis } from "@/lib/env";
import { ApiError } from "@/lib/http";

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: env.upstashRedisUrl,
      token: env.upstashRedisToken,
    });
  }
  return redis;
}

/** Per-purpose rate limits (requests / window). AI routes are stricter. */
const CONFIG = {
  mutation: { tokens: 30, window: "1 m" as const },
  ai: { tokens: 10, window: "1 m" as const },
} satisfies Record<
  string,
  { tokens: number; window: `${number} ${"s" | "m"}` }
>;

export type LimiterName = keyof typeof CONFIG;

function getLimiter(name: LimiterName): Ratelimit {
  let limiter = limiters.get(name);
  if (!limiter) {
    const cfg = CONFIG[name];
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
      prefix: `payguard:rl:${name}`,
      analytics: false,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

/**
 * Enforce a rate limit for an identifier (typically the authenticated user id).
 * Throws ApiError('rate_limited') when exceeded. No-ops when Redis is not
 * configured (e.g. local dev without Upstash) so the app stays usable.
 */
export async function enforceRateLimit(
  name: LimiterName,
  identifier: string,
): Promise<void> {
  if (!hasRedis()) return;
  const { success } = await getLimiter(name).limit(identifier);
  if (!success) {
    throw new ApiError("rate_limited", "Too many requests. Please slow down.");
  }
}
