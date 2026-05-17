import { expect, test } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import { createConfirmedUser } from "./helpers/supabase";

test("protected APIs reject anonymous requests", async ({ request }) => {
  const cvs = await request.get("/api/cvs");
  expect(cvs.status()).toBe(401);

  const analyses = await request.get("/api/cv-analyses");
  expect(analyses.status()).toBe(401);

  const adminMe = await request.get("/api/admin/me");
  expect(adminMe.status()).toBe(401);
  expect(await adminMe.json()).toEqual({ isAdmin: false });
});

test("confirmed local user can sign in through the UI and is not admin", async ({
  page,
}) => {
  const user = await createConfirmedUser("auth");

  await loginViaUI(page, user);

  const adminMe = await page.request.get("/api/admin/me");
  expect(adminMe.status()).toBe(200);
  expect(await adminMe.json()).toEqual({ isAdmin: false });
});
