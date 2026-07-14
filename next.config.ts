import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Strict Content-Security-Policy.
 *
 * Allow-listed origins:
 *  - self
 *  - Clerk (auth UI, frontend API, Cloudflare Turnstile bot protection)
 *  - Vercel Blob (private uploads served via signed URLs)
 *  - Upstash REST endpoints (in case any client telemetry is used)
 *
 * Gemini, Neon, Upstash Vector/Redis writes all happen server-side only, so
 * they are intentionally absent from the browser policy.
 *
 * `'unsafe-inline'` is required for Next.js' hydration bootstrap and Clerk's
 * injected styles; `'unsafe-eval'` is added only in development for the dev
 * runtime / HMR and is never sent in production.
 */
function contentSecurityPolicy(): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    isProd ? "" : "'unsafe-eval'",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://challenges.cloudflare.com",
  ]
    .filter(Boolean)
    .join(" ");

  const connectSrc = [
    "'self'",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://*.upstash.io",
    "https://*.public.blob.vercel-storage.com",
    "https://*.blob.vercel-storage.com",
    isProd ? "" : "ws://localhost:*",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com https://*.public.blob.vercel-storage.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "worker-src 'self' blob:",
    "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.com",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
