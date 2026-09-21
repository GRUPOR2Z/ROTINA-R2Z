import { test, expect } from "@playwright/test";

test("rota protegida redireciona para /login sem sessão", async ({ page }) => {
  await page.goto("/rotinas");
  await expect(page).toHaveURL(/\/login$/);
});

test("/login continua acessível sem sessão", async ({ page }) => {
  const response = await page.goto("/login");
  expect(response?.status()).toBe(200);
});
