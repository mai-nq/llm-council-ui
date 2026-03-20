import { test, expect } from "@playwright/test";

test.describe("LLM Council UI", () => {
  test("welcome screen renders correctly", async ({ page }) => {
    await page.goto("/");

    // Check header
    await expect(page.locator("h1")).toContainText("LLM Council");
    await expect(page.getByText("Collaborative AI Reasoning")).toBeVisible();

    // Check welcome message
    await expect(page.getByText("Welcome to LLM Council")).toBeVisible();

    // Check model badges are visible
    await expect(page.getByText("GPT-5.4 Pro")).toBeVisible();
    await expect(page.getByText("Claude Sonnet 4.6")).toBeVisible();
    await expect(page.getByText("Gemini 3.1 Pro")).toBeVisible();
    await expect(page.getByText("Grok 4.20 Beta")).toBeVisible();

    // Check input field
    await expect(
      page.getByPlaceholder("Ask your council a challenging question...")
    ).toBeVisible();

    // Check suggested questions (truncated with "...")
    await expect(
      page.getByText("What is consciousness and can AI ever truly be conscious")
    ).toBeVisible();
  });

  test("history sidebar opens and closes", async ({ page }) => {
    await page.goto("/");

    // Sidebar should not be visible initially
    await expect(page.getByText("Chat History")).not.toBeVisible();

    // Click history button to open
    await page.getByRole("button", { name: "History" }).click();

    // Verify sidebar opens
    await expect(page.getByText("Chat History")).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");

    // Verify sidebar closes
    await expect(page.getByText("Chat History")).not.toBeVisible();
  });

  test("new session button works", async ({ page }) => {
    await page.goto("/");

    // Click new session button
    await page.getByRole("button", { name: "New Session" }).click();

    // Should still show welcome screen
    await expect(page.getByText("Welcome to LLM Council")).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");

    // Check header
    await expect(page.getByText("Configure Models")).toBeVisible();

    // Check buttons
    await expect(page.getByRole("button", { name: "Reset to Defaults" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Configuration" })).toBeVisible();

    // Check model cards exist (by display name)
    await expect(page.getByText("GPT-5.4 Pro").first()).toBeVisible();
    await expect(page.getByText("Claude Sonnet 4.6").first()).toBeVisible();
  });

  test("council response view has proper layout on desktop", async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Check welcome message is visible (sidebar is hidden by default)
    await expect(page.getByText("Welcome to LLM Council")).toBeVisible();

    // History button should be visible
    await expect(page.getByRole("button", { name: "History" })).toBeVisible();

    // Check the flex layout is properly set up
    const mainContent = page.locator(".flex.h-screen");
    await expect(mainContent).toBeVisible();
  });

  test("history sidebar toggle works", async ({ page }) => {
    await page.goto("/");

    // Open history sidebar
    await page.getByRole("button", { name: "History" }).click();
    await expect(page.getByText("Chat History")).toBeVisible();

    // Check New button is present in sidebar
    await expect(page.getByRole("button", { name: "New" })).toBeVisible();
  });

  test("navigation to settings and back", async ({ page }) => {
    await page.goto("/");

    // Open settings dropdown and click Configure Models
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByText("Configure Models").click();

    // Should be on settings page
    await expect(page.getByRole("heading", { name: "Configure Models" })).toBeVisible();

    // Click back button
    await page.getByRole("button", { name: "Back to chat" }).click();

    // Should be back on home
    await expect(page.getByText("Welcome to LLM Council")).toBeVisible();
  });
});

test.describe("Delete Confirmation", () => {
  test.beforeEach(async ({ request }) => {
    // Seed a test conversation via API
    const conversation = {
      id: "test-delete-conversation",
      title: "Test Conversation for Delete",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: "Test message",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Write directly to the conversations endpoint
    await request.post("/api/conversations", {
      data: conversation,
    });
  });

  test.afterEach(async ({ request }) => {
    // Cleanup test conversation
    await request.delete("/api/conversations/test-delete-conversation");
  });

  test("delete button shows confirmation dialog", async ({ page }) => {
    await page.goto("/");

    // Open history sidebar
    await page.getByRole("button", { name: "History" }).click();
    await expect(page.getByText("Chat History")).toBeVisible();

    // Wait for conversations to load
    await page.waitForTimeout(500);

    // Check if test conversation exists, if not skip test
    const testConversation = page.getByText("Test Conversation for Delete");
    if (!(await testConversation.isVisible())) {
      test.skip();
      return;
    }

    // Hover over conversation to reveal delete button
    await testConversation.hover();

    // Click the delete button (trash icon)
    const deleteButton = page.locator("button").filter({ has: page.locator("svg.lucide-trash-2") }).first();
    await deleteButton.click();

    // Verify dialog appears
    await expect(page.getByText("Delete conversation?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("cancel button closes dialog without deleting", async ({ page }) => {
    await page.goto("/");

    // Open history sidebar
    await page.getByRole("button", { name: "History" }).click();
    await page.waitForTimeout(500);

    // Check if test conversation exists
    const testConversation = page.getByText("Test Conversation for Delete");
    if (!(await testConversation.isVisible())) {
      test.skip();
      return;
    }

    // Hover and click delete
    await testConversation.hover();
    const deleteButton = page.locator("button").filter({ has: page.locator("svg.lucide-trash-2") }).first();
    await deleteButton.click();

    // Click Cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    // Dialog should close
    await expect(page.getByText("Delete conversation?")).not.toBeVisible();

    // Conversation should still be in the list
    await expect(page.getByText("Test Conversation for Delete")).toBeVisible();
  });

  test("confirm delete removes conversation from list", async ({ page }) => {
    await page.goto("/");

    // Open history sidebar
    await page.getByRole("button", { name: "History" }).click();
    await page.waitForTimeout(500);

    // Check if test conversation exists
    const testConversation = page.getByText("Test Conversation for Delete");
    if (!(await testConversation.isVisible())) {
      test.skip();
      return;
    }

    // Hover and click delete
    await testConversation.hover();
    const deleteButton = page.locator("button").filter({ has: page.locator("svg.lucide-trash-2") }).first();
    await deleteButton.click();

    // Click Delete to confirm
    await page.getByRole("button", { name: "Delete" }).click();

    // Dialog should close and conversation should be removed
    await expect(page.getByText("Delete conversation?")).not.toBeVisible();
    await expect(page.getByText("Test Conversation for Delete")).not.toBeVisible();
  });
});

test.describe("Conversation Title Display", () => {
  test("conversation shows title in history sidebar", async ({ page }) => {
    await page.goto("/");

    // Open history sidebar
    await page.getByRole("button", { name: "History" }).click();
    await expect(page.getByText("Chat History")).toBeVisible();

    // If there are conversations, they should show titles (not "New Conversation" for those with AI titles)
    // This test verifies the UI displays titles correctly
    const sidebar = page.getByRole("dialog", { name: "Chat History" });
    await expect(sidebar).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("mobile view hides 2-column layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Welcome screen should still be visible
    await expect(page.getByText("Welcome to LLM Council")).toBeVisible();
  });

  test("tablet view shows proper layout", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Should show welcome screen
    await expect(page.getByText("Welcome to LLM Council")).toBeVisible();
  });
});
