import { test, expect } from "@playwright/test";

test.skip("debug conversation view", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  await page.waitForTimeout(500);

  // Click on conversation "What is consciousness..."
  const convItem = page.getByText("What is consciousness").first();
  if (await convItem.isVisible()) {
    await convItem.click();
    await page.waitForTimeout(2000);

    // Scroll the scrollable container to top
    const scrollContainer = page.locator(".overflow-auto").first();
    await scrollContainer.evaluate((el) => el.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Take viewport screenshot
    await page.screenshot({ path: "test-results/debug-viewport.png" });

    // Take full page screenshot
    await page.screenshot({ path: "test-results/debug-fullpage.png", fullPage: true });

    // Scroll down a bit to see tabs area
    const tabsList = page.locator("[role='tablist']").first();
    await tabsList.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "test-results/debug-tabs-area.png" });

    console.log("Screenshots saved!");
  }
});
