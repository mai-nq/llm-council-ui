import { test } from "@playwright/test";

test.describe("Screenshot Tests", () => {
  test("capture welcome screen", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/welcome-screen.png", fullPage: true });
  });

  test("capture settings page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/settings");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/settings-page.png", fullPage: true });
  });

  test("capture conversation with responses", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForTimeout(500);

    // Click on conversation "What is consciousness..."
    const convItem = page.getByText("What is consciousness").first();
    if (await convItem.isVisible()) {
      await convItem.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: "test-results/conversation-view.png", fullPage: true });
    } else {
      // Fallback: click any conversation with 2 messages
      const convWithMessages = page.getByText("2 messages").first();
      if (await convWithMessages.isVisible()) {
        await convWithMessages.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: "test-results/conversation-view.png", fullPage: true });
      }
    }
  });
});
