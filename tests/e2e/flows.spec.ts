import { expect, test } from "@playwright/test";

/**
 * Happy-path flows against a deployed preview. These require an authenticated
 * session, so they are skipped unless E2E credentials are provided.
 *
 * To run:
 *   1. Seed an author + reviewer (pnpm db:seed) and create real Clerk users.
 *   2. Capture a Clerk-authenticated storage state (see @clerk/testing) and set
 *      E2E_AUTHENTICATED=1 plus the storage state in playwright config.
 */
const authed = process.env.E2E_AUTHENTICATED === "1";

test.describe("compliance flows", () => {
  test.skip(!authed, "requires an authenticated session (E2E_AUTHENTICATED=1)");

  test("author: upload → analyze → draft → submit", async ({ page }) => {
    await page.goto("/documents/new");
    await page.getByLabel("Title").fill("E2E Merchant Agreement");
    await page.getByRole("tab", { name: "Paste text" }).click();
    await page
      .getByLabel("Document text")
      .fill(
        "The institution must investigate electronic fund transfer errors within 10 business days and disclose all account fees before opening.",
      );
    await page.getByRole("button", { name: "Save document" }).click();

    await expect(page).toHaveURL(/\/documents\/[a-z0-9]+/);
    await page.getByRole("button", { name: "Analyze document" }).click();

    // Wait for the pipeline to finish and a draft to appear.
    await expect(page.getByText("Compliance draft")).toBeVisible({
      timeout: 120_000,
    });

    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByText(/In review/i)).toBeVisible();
  });

  test("reviewer: approve a submitted draft", async ({ page }) => {
    await page.goto("/review");
    await page.getByRole("link").first().click();
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText(/Approved/i)).toBeVisible();
  });

  test("reviewer: request changes loops back to drafting", async ({ page }) => {
    await page.goto("/review");
    await page.getByRole("link").first().click();
    await page
      .getByPlaceholder(/Comments/i)
      .fill("Please ground the funds-availability claim.");
    await page.getByRole("button", { name: "Request changes" }).click();
    await expect(page.getByText(/Changes requested/i)).toBeVisible();
  });
});
