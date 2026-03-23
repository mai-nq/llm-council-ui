import { test, expect } from "@playwright/test";

const PASSWORD = "M1nhG@u230724";

test("debug council API response", async ({ page }) => {
  // Set longer timeout for API calls - 5 minutes
  test.setTimeout(300000);

  await page.setViewportSize({ width: 1920, height: 1080 });

  // Listen to console logs - especially SSE logs
  page.on("console", (msg) => {
    const text = msg.text();
    // Always show SSE and council logs
    if (text.includes("[SSE]") || text.includes("Council")) {
      console.log(`[Browser]:`, text);
    } else if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`[Browser ${msg.type()}]:`, text);
    }
  });

  // Listen to network requests
  page.on("request", (request) => {
    if (request.url().includes("/api/")) {
      console.log(`[Request] ${request.method()} ${request.url()}`);
    }
  });

  page.on("response", async (response) => {
    if (response.url().includes("/api/")) {
      console.log(`[Response] ${response.status()} ${response.url()}`);
      if (response.status() !== 200 && response.status() !== 304) {
        try {
          const body = await response.text();
          console.log(`[Response Body] ${body.slice(0, 500)}`);
        } catch {}
      }
    }
  });

  // Go to login page
  await page.goto("/login");
  await page.waitForTimeout(500);

  // Login
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/", { timeout: 10000 });
  console.log("Logged in successfully");

  // Wait for page to load
  await page.waitForTimeout(1000);

  // Type a simple question
  const textarea = page.locator("textarea").first();
  await textarea.fill("Hello, what is 2+2?");
  console.log("Filled textarea");

  // Submit the question
  await page.keyboard.press("Enter");
  console.log("Submitted question");

  // Wait for response with timeout - up to 3 minutes
  console.log("Waiting for council response...");

  // Take screenshots at intervals
  for (let i = 0; i < 36; i++) {
    await page.waitForTimeout(5000);

    // Check if response is complete
    const finalResponse = page.locator("text=Final Response");
    if (await finalResponse.isVisible()) {
      console.log(`Final Response is visible at ${(i + 1) * 5}s!`);
      await page.screenshot({ path: `test-results/council-debug-complete.png` });
      break;
    }

    // Check for error message (red text)
    const errorText = page.locator("text=Error:");
    if (await errorText.count() > 0) {
      const error = await errorText.first().textContent();
      console.log("Error found:", error);
      await page.screenshot({ path: `test-results/council-debug-error.png` });
      break;
    }

    // Log progress every 15s
    if ((i + 1) % 3 === 0) {
      console.log(`Still waiting... ${(i + 1) * 5}s`);
    }
  }

  // Final screenshot
  await page.screenshot({ path: "test-results/council-debug-final.png" });

  // Click on other model tabs to see their responses
  const claudeTab = page.getByRole("tab", { name: /Claude Sonnet/i }).first();
  if (await claudeTab.isVisible()) {
    await claudeTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/council-debug-claude.png" });
    console.log("Claude tab screenshot taken");
  }

  const geminiTab = page.getByRole("tab", { name: /Gemini/i }).first();
  if (await geminiTab.isVisible()) {
    await geminiTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/council-debug-gemini.png" });
    console.log("Gemini tab screenshot taken");
  }

  const grokTab = page.getByRole("tab", { name: /Grok/i }).first();
  if (await grokTab.isVisible()) {
    await grokTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/council-debug-grok.png" });
    console.log("Grok tab screenshot taken");
  }

  console.log("Test complete");
});
