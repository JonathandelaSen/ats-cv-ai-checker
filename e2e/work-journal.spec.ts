import { expect, test } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import { createConfirmedUser } from "./helpers/supabase";
import { messages } from "../src/i18n/messages";

const t = messages.en.workJournal;
const c = messages.en.common;

test("user can create, edit, and delete work journal entries", async ({ page }) => {
  const user = await createConfirmedUser("journal");
  await loginViaUI(page, user);

  // Navigate to Work Journal
  await page.goto("/?view=journal");
  await expect(page.getByRole("heading", { name: t.title })).toBeVisible();

  // Create new context and entry
  await page.getByRole("button", { name: t.newEntry }).click();
  
  // Create a new context
  const contextPromise = page.waitForResponse(r => r.url().includes('/api/work-journal/contexts') && r.request().method() === 'POST');
  await page.getByPlaceholder(t.contextNamePlaceholder).fill("E2E Project Context");
  await page.keyboard.press("Enter");
  await contextPromise;
  
  // Fill the entry notes
  const notesContent = "Completed the first part of the E2E testing framework.";
  await page.getByPlaceholder(t.notesPlaceholder).fill(notesContent);
  
  // Save entry
  await page.getByRole("button", { name: t.saveEntry }).click();

  // The form should close
  await expect(page.getByPlaceholder(t.notesPlaceholder)).not.toBeVisible();

  // Verify it appears in the list (now it must be the rendered entry)
  await expect(page.getByText(notesContent)).toBeVisible();

  // Edit entry
  const updatedContent = "Updated: Completed E2E testing framework.";
  await page.getByTitle(t.editEntry).click({ force: true });
  
  // Fill the raw notes
  const textareas = page.locator("textarea");
  await textareas.nth(0).fill(updatedContent);
  
  await page.getByRole("button", { name: t.saveChanges }).click();

  // Verify edit
  await expect(page.getByText(updatedContent)).toBeVisible();

  // Delete entry
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTitle(t.deleteEntry).click({ force: true });

  // Verify deletion
  await expect(page.getByText(updatedContent)).not.toBeVisible();
});
