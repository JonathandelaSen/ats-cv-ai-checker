import { expect, test } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import { createFixtureViaApi } from "./helpers/cv";
import { createConfirmedUser } from "./helpers/supabase";

test("core API guards return controlled errors without external AI calls", async ({
  page,
}) => {
  const user = await createConfirmedUser("guards");
  await loginViaUI(page, user);

  const missingCv = await page.request.post("/api/analyses", {
    data: { title: "Missing CV" },
  });
  expect(missingCv.status()).toBe(400);
  expect(await missingCv.json()).toEqual({ error: "cvId is required" });

  const missingGemini = await page.request.post("/api/score", {
    data: {
      analysisId: "00000000-0000-0000-0000-000000000000",
      mode: "general",
      geminiApiKey: "",
    },
  });
  expect(missingGemini.status()).toBe(400);
  expect(await missingGemini.json()).toEqual({
    error:
      "Configura tu API key de Gemini en Configuración antes de lanzar el análisis.",
  });

  const fixture = await createFixtureViaApi(page.request, "guards");

  const blockedCvDelete = await page.request.delete(`/api/cvs/${fixture.cv.id}`);
  expect(blockedCvDelete.status()).toBe(409);
  expect(await blockedCvDelete.json()).toEqual(
    expect.objectContaining({
      error: "No puedes borrar un CV con análisis asociados.",
    })
  );

  const analysisDelete = await page.request.delete(
    `/api/analyses/${fixture.analysis.id}`
  );
  expect(analysisDelete.status()).toBe(200);
  expect(await analysisDelete.json()).toEqual({ success: true });

  const cvDelete = await page.request.delete(`/api/cvs/${fixture.cv.id}`);
  expect(cvDelete.status()).toBe(200);
  expect(await cvDelete.json()).toEqual({ success: true });
});
