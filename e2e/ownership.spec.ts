import { expect, test } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import { createFixtureViaApi } from "./helpers/cv";
import { createConfirmedUser } from "./helpers/supabase";

test("users cannot read another user's CVs or analyses", async ({ browser }) => {
  const owner = await createConfirmedUser("owner");
  const other = await createConfirmedUser("other");

  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await loginViaUI(ownerPage, owner);
  const fixture = await createFixtureViaApi(ownerPage.request, "owned");
  await ownerContext.close();

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await loginViaUI(otherPage, other);

  const cvDetail = await otherPage.request.get(`/api/cvs/${fixture.cv.id}`);
  expect(cvDetail.status()).toBe(404);

  const analysisDetail = await otherPage.request.get(
    `/api/cv-analyses/${fixture.analysis.id}`
  );
  expect(analysisDetail.status()).toBe(404);

  const cvs = (await (await otherPage.request.get("/api/cvs")).json()) as Array<{
    id: string;
  }>;
  expect(cvs.some((cv) => cv.id === fixture.cv.id)).toBe(false);

  const analyses = (await (
    await otherPage.request.get("/api/cv-analyses")
  ).json()) as Array<{ id: string }>;
  expect(analyses.some((analysis) => analysis.id === fixture.analysis.id)).toBe(
    false
  );

  await otherContext.close();
});
