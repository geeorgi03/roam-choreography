const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("share pack generate/import keeps section artifacts", async ({ page }) => {
  await page.fill("#sessionName", "Pack Session");
  await page.click("#createSession");

  await page.fill("#dancerName", "Mina");
  await page.click("#addDancer");

  await page.fill("#sectionName", "Bridge");
  await page.click("#addSection");

  await page.selectOption("#assignSection", { label: "Bridge" });
  await page.selectOption("#assignDancer", { label: "Mina" });
  await page.click("#createAssignment");

  await page.selectOption("#refSection", { label: "Bridge" });
  await page.fill("#refUrl", "https://example.com/tutorial?t=45");
  await page.click("#addReference");

  await page.selectOption("#takeSection", { label: "Bridge" });
  await page.fill("#takeDuration", "30");
  await page.fill("#takeNotes", "first pass");
  await page.click("#addTake");

  await page.selectOption("#shareSection", { label: "Bridge" });
  await page.click("#generateSharePack");

  const payload = await page.inputValue("#sharePayload");
  expect(payload.length).toBeGreaterThan(40);

  await page.click("#importSharePack");

  await expect(page.locator("#sectionList")).toContainText("Bridge");
  await expect(page.locator("#sectionList")).toContainText("(imported)");
  await expect(page.locator("#referenceList")).toContainText("00:45");
  await expect(page.locator("#takeList")).toContainText("30s");
});
