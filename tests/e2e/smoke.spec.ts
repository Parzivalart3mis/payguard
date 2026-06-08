import { expect, test } from "@playwright/test";

// These run against any deployed preview/prod without auth.

test("health endpoint responds ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ status: "ok" });
});

test("the web app manifest is served and standalone", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.name).toBe("PayGuard");
  expect(manifest.display).toBe("standalone");
  expect(manifest.theme_color).toBe("#1E3A5F");
});

test("an unauthenticated visit is redirected to sign-in", async ({ page }) => {
  await page.goto("/documents");
  await expect(page).toHaveURL(/sign-in/);
});
