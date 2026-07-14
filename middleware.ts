import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Public routes (everything else requires authentication):
 *  - /                         public landing page (redirects signed-in users to the app)
 *  - GET /api/health           liveness probe
 *  - /api/webhooks/clerk       Clerk -> app user sync (verified via svix signature)
 *  - /sign-in, /sign-up        auth screens
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/health",
  "/api/webhooks/clerk",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static/PWA assets unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|webp|woff2?|ttf|eot|otf|webmanifest|map)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
