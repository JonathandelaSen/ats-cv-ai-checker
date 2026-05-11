import { expect, test } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import { createExtractionViaUI } from "./helpers/cv";
import {
  adminClient,
  createConfirmedUser,
  getProcessingEvents,
} from "./helpers/supabase";

test("user can upload a PDF, create an extraction, and read persisted backend state", async ({
  page,
}) => {
  const user = await createConfirmedUser("core");

  await loginViaUI(page, user);
  const { cvName, analysisTitle, analysis } = await createExtractionViaUI(page);

  const cvsResponse = await page.request.get("/api/cvs");
  expect(cvsResponse.status()).toBe(200);
  const cvs = (await cvsResponse.json()) as Array<{ id: string; name: string }>;
  const cv = cvs.find((item) => item.id === analysis.cv_id);
  expect(cv?.name).toBe(cvName);

  const analysesResponse = await page.request.get("/api/analyses");
  expect(analysesResponse.status()).toBe(200);
  const analyses = (await analysesResponse.json()) as Array<{
    id: string;
    title: string;
  }>;
  expect(analyses).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: analysis.id, title: analysisTitle }),
    ])
  );

  const detailResponse = await page.request.get(`/api/analyses/${analysis.id}`);
  expect(detailResponse.status()).toBe(200);
  const detail = await detailResponse.json();
  expect(detail).toMatchObject({
    id: analysis.id,
    cv_id: analysis.cv_id,
    title: analysisTitle,
    ai_score: null,
  });

  const { data: storageObjects, error: storageError } = await adminClient.storage
    .from("cv-pdfs")
    .list(user.id);
  expect(storageError).toBeNull();
  expect(storageObjects?.some((object) => object.name.includes(analysis.cv_id))).toBe(
    true
  );

  const events = await getProcessingEvents({
    userId: user.id,
    cvId: analysis.cv_id,
    analysisId: analysis.id,
  });
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ stage: "analysis_persist", status: "success" }),
    ])
  );

  const cvEvents = await getProcessingEvents({
    userId: user.id,
    cvId: analysis.cv_id,
  });
  expect(cvEvents).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ stage: "cv_upload", status: "success" }),
      expect.objectContaining({ stage: "pdf_parser" }),
    ])
  );
});
