import { expect, test } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import { createConfirmedUser } from "./helpers/supabase";
import { createExtractionViaUI } from "./helpers/cv";
import { messages } from "../src/i18n/messages";

const tForms = messages.en.analysisFlow.forms;
const tMode = messages.en.analysisFlow.modeSelector;

test("user can create a job match analysis and view the results", async ({
  page,
}) => {
  page.on("console", (msg) => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  const user = await createConfirmedUser("job-match");
  await loginViaUI(page, user);

  // Set API key via UI to ensure proper state sync
  await page.getByRole("button", { name: messages.en.navigation.settings }).click();
  await page.getByPlaceholder(messages.en.settings.apiKey.placeholder).fill("test-api-key");
  await page.getByRole("button", { name: messages.en.common.actions.save }).click();
  await expect(page.getByText(messages.en.common.actions.saved)).toBeVisible();

  // Navigate back to New Analysis
  await page.getByRole("button", { name: messages.en.navigation.newAnalysis }).click();

  // 1. Upload a CV via UI and create an analysis
  // This leaves us in the Extraction View with the mode selector
  await createExtractionViaUI(page);

  // 2. Select Mode
  await page.getByText(tMode.jobTitle).click();

  // 3. Fill Job
  const jobDescription = "We are looking for a Senior React Developer with 5+ years of experience in Next.js.";
  await page.locator("textarea").fill(jobDescription);

  // 4. Mock API
  await page.route(/\/api\/job-match-analyses\/[^\/]+\/score/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true })
    });
  });

  await page.route(/\/api\/job-match-analyses\/[^\/]+$/, async (route) => {
    if (route.request().method() === "GET") {
      const json = {
        id: "mocked-id",
        cv_id: "mocked-cv-id",
        title: "Job Match Test",
        filename: "test.pdf",
        created_at: new Date().toISOString(),
        analysis_mode: "job_match",
        ai_score: 85,
        ai_analyzed_at: new Date().toISOString(),
        job_url: null,
        offer_status: null,
        offer_next_action_at: null,
        user_id: "user-id",
        file_size: 1000,
        pdf_storage_path: "path",
        updated_at: new Date().toISOString(),
        ai_model: "gemini-2.5-flash",
        job_description: jobDescription,
        offer_notes: null,
        offer_next_action: null,
        ai_context: null,
        ai_feedback: "Great match for the position.",
        ai_keywords: JSON.stringify(["React", "Next.js"]),
        ai_improvements: JSON.stringify(["Add more tests to your CV"]),
        job_key_data: "null",
        job_keywords: JSON.stringify(["React", "Next.js", "TypeScript"]),
        cv_keywords: JSON.stringify(["React", "Next.js"]),
        matching_keywords: JSON.stringify(["React", "Next.js"]),
        missing_keywords: JSON.stringify(["TypeScript"]),
        text_python: "John Doe CV\nExperience: Developer",
        text_pdfjs: null,
        text_node: null,
        extract_error_python: null,
        extract_error_pdfjs: null,
        extract_error_node: null
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(json)
      });
    } else {
      await route.continue();
    }
  });

  // 5. Click "Compare offer"
  await page.getByRole("button", { name: tForms.compareOffer }).click();

  // 6. Verify score
  await expect(page.getByText("85")).toBeVisible();
  await expect(page.getByText("Great match for the position.")).toBeVisible();
});
