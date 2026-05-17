import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { uniqueLabel } from "./env";

export interface CreatedAnalysisFixture {
  cv: {
    id: string;
  };
  analysis: {
    id: string;
    cv_id: string;
  };
}

interface AnalysisResponse {
  id: string;
  cv_id: string;
}

export async function createExtractionViaUI(page: Page) {
  const cvName = uniqueLabel("ui-cv");
  const analysisTitle = uniqueLabel("ui-analysis");

  await page.getByTestId("new-analysis-upload-source").click();
  await page
    .getByTestId("new-analysis-file-input")
    .setInputFiles(path.resolve(process.cwd(), "test.pdf"));
  await page.getByPlaceholder("Frontend CV April").fill(cvName);
  await page.getByPlaceholder("React Frontend - Factorial").fill(analysisTitle);

  const analysisResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/cv-analyses") &&
      response.request().method() === "POST"
  );
  await page.getByTestId("new-analysis-submit").click();
  const analysisResponse = await analysisResponsePromise;
  expect(analysisResponse.ok()).toBeTruthy();
  const analysis = (await analysisResponse.json()) as AnalysisResponse;

  await expect(page).toHaveURL(new RegExp(`analysis=${analysis.id}`));

  return { cvName, analysisTitle, analysis };
}

export async function createFixtureViaApi(
  request: APIRequestContext,
  prefix = "api"
): Promise<CreatedAnalysisFixture> {
  const cvName = uniqueLabel(`${prefix}-cv`);
  const analysisTitle = uniqueLabel(`${prefix}-analysis`);
  const pdf = readFileSync(path.resolve(process.cwd(), "test.pdf"));

  const cvResponse = await request.post("/api/cvs", {
    multipart: {
      name: cvName,
      file: {
        name: `${cvName}.pdf`,
        mimeType: "application/pdf",
        buffer: pdf,
      },
    },
  });
  expect(cvResponse.ok()).toBeTruthy();
  const cv = (await cvResponse.json()) as CreatedAnalysisFixture["cv"];

  const analysisResponse = await request.post("/api/cv-analyses", {
    data: {
      cvId: cv.id,
      title: analysisTitle,
    },
  });
  expect(analysisResponse.ok()).toBeTruthy();
  const analysis =
    (await analysisResponse.json()) as CreatedAnalysisFixture["analysis"];

  return { cv, analysis };
}
