const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/?ref=ROAM-TEST42");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/?ref=ROAM-TEST42");
});

test("captures referral attribution and user validation feedback", async ({ page }) => {
  await expect(page.locator("#growthFunnel")).toContainText("Attribution Ref");
  await expect(page.locator("#growthFunnel")).toContainText("ROAM-TEST42");

  await page.fill("#feedbackName", "Pilot User");
  await page.fill("#feedbackRole", "choreographer");
  await page.fill("#feedbackScore", "9");
  await page.fill("#feedbackNotes", "Flow is fast, assignment works well.");
  await page.click("#submitFeedback");

  await expect(page.locator("#feedbackStatus")).toContainText("1 feedback response");
  await expect(page.locator("#reliabilityReport")).toContainText("Avg Feedback Score");
  await expect(page.locator("#reliabilityReport")).toContainText("9.0");
});
