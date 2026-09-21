import { test, expect } from "@playwright/test";

test("navega entre login e cadastro", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByRole("heading", { name: "Criar conta — Grupo R2Z OS" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("/signup continua acessível sem sessão", async ({ page }) => {
  const response = await page.goto("/signup");
  expect(response?.status()).toBe(200);
});
