import { expect, type Page } from "@playwright/test";
import type { E2EUser } from "./supabase";

export async function loginViaUI(page: Page, user: E2EUser) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Nueva extracción")).toBeVisible();
}
