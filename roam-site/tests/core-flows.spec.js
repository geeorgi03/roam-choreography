const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("core choreography and growth flows", async ({ page }) => {
  await page.fill("#sessionName", "Studio Run");
  await page.click("#createSession");
  await expect(page.locator("#activeSessionText")).toContainText("Studio Run");

  await page.fill("#dancerName", "Mina");
  await page.fill("#dancerRole", "Lead");
  await page.click("#addDancer");
  await expect(page.locator("#dancerList")).toContainText("Mina");

  await page.fill("#sectionName", "Chorus A");
  await page.selectOption("#sectionStatus", "in-progress");
  await page.click("#addSection");
  await expect(page.locator("#sectionList")).toContainText("Chorus A");

  await page.selectOption("#assignSection", { label: "Chorus A" });
  await page.selectOption("#assignDancer", { label: "Mina" });
  await page.selectOption("#assignStatus", "in-progress");
  await page.fill("#assignDueDate", "2026-12-31");
  await page.click("#createAssignment");
  await expect(page.locator("#assignmentList")).toContainText("Chorus A");
  await expect(page.locator("#assignmentList")).toContainText("Mina");

  // Timestamp should auto-parse from t=90 to 01:30.
  await page.selectOption("#refSection", { label: "Chorus A" });
  await page.fill("#refUrl", "https://www.youtube.com/watch?v=abc123&t=90");
  await page.click("#addReference");
  await expect(page.locator("#referenceList")).toContainText("01:30");

  await page.selectOption("#takeSection", { label: "Chorus A" });
  await page.selectOption("#takeType", "MINE");
  await page.fill("#takeDuration", "45");
  await page.fill("#takeNotes", "clean run");
  await page.click("#addTake");
  await expect(page.locator("#takeList")).toContainText("45s");

  await page.click("#generateReferral");
  const referralCode = await page.inputValue("#referralCode");
  expect(referralCode).toMatch(/^ROAM-/);

  await page.fill("#inviteEmail", "teammate@example.com");
  await page.click("#sendInvite");
  await expect(page.locator("#inviteStatus")).toContainText("1 invite");

  await page.fill("#waitlistName", "Alex");
  await page.fill("#waitlistEmail", "alex@example.com");
  await page.click("#joinWaitlist");
  await expect(page.locator("#growthFunnel")).toContainText("Waitlist Leads");
  await expect(page.locator("#growthFunnel")).toContainText("1");
});
