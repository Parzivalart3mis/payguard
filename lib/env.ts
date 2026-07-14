/**
 * Lazy, typed access to required environment variables.
 *
 * Getters are evaluated on access (not at import) so the app and its route
 * bundles build without secrets present; a missing variable throws a clear
 * error only when the dependent feature is actually exercised.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get databaseUrl(): string {
    return required("DATABASE_URL");
  },
  get geminiApiKey(): string {
    return required("GEMINI_API_KEY");
  },
  get clerkWebhookSecret(): string {
    return required("CLERK_WEBHOOK_SIGNING_SECRET");
  },
  get upstashVectorUrl(): string {
    return required("UPSTASH_VECTOR_REST_URL");
  },
  get upstashVectorToken(): string {
    return required("UPSTASH_VECTOR_REST_TOKEN");
  },
  get upstashRedisUrl(): string {
    return required("UPSTASH_REDIS_REST_URL");
  },
  get upstashRedisToken(): string {
    return required("UPSTASH_REDIS_REST_TOKEN");
  },
  get blobToken(): string {
    return required("BLOB_READ_WRITE_TOKEN");
  },
};

/** True when Upstash Redis is configured (rate limiting otherwise no-ops). */
export function hasRedis(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

/** True when Upstash Vector is configured. */
export function hasVector(): boolean {
  return Boolean(
    process.env.UPSTASH_VECTOR_REST_URL &&
    process.env.UPSTASH_VECTOR_REST_TOKEN,
  );
}
