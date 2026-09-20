import { test, expect } from "@playwright/test";

test("login exibe erro para credenciais inválidas", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Grupo R2Z OS" })).toBeVisible();

  await page.getByLabel("E-mail").fill("naoexiste@r2z.com.br");
  await page.getByLabel("Senha").fill("senha-errada-123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
});
