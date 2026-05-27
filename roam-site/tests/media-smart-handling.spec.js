const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("platform video link uses smart external handling and reference sync", async ({ page }) => {
  await page.fill("#sectionName", "Intro");
  await page.click("#addSection");
  await page.selectOption("#refSection", { label: "Intro" });

  await page.fill("#videoUrlInput", "https://www.youtube.com/watch?v=test123&t=90");
  await page.click("#loadVideoUrl");

  await expect(page.locator("#videoSourceType")).toContainText("youtube");
  await expect(page.locator("#mediaStatus")).toContainText("Platform link detected");
  await expect(page.locator("#openVideoExternally")).toContainText("01:30");
  await expect(page.locator("#refUrl")).toHaveValue(/youtube/);
  await expect(page.locator("#refTimestamp")).toHaveValue("01:30");
});
