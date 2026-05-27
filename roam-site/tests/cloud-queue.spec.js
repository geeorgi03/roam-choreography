const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("cloud queue controls show correct pending behavior", async ({ page }) => {
  await expect(page.locator("#cloudQueueStatus")).toContainText("Pending cloud writes: 0");
  await page.click("#flushCloudQueue");
  await expect(page.locator("#feedback")).toContainText("Configure cloud first.");

  await page.fill("#supabaseUrl", "https://example.supabase.co");
  await page.fill("#supabaseAnonKey", "public-anon-key");
  await page.click("#saveCloudConfig");
  await expect(page.locator("#cloudStatus")).toContainText("Configured, not signed in");

  await page.click("#flushCloudQueue");
  await expect(page.locator("#feedback")).toContainText("Sign in before flushing cloud queue.");
});
