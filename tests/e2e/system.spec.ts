import { expect, test } from "@playwright/test";

test.describe("System Features", () => {
  test("should load landing page with correct elements", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verificar elementos básicos de la página (según error-context muestra "MCSupport" y "Login")
    await expect(page.getByRole("heading", { name: /MCSupport/i })).toBeVisible(
      { timeout: 10000 }
    );

    // Verificar que hay un link/botón de login
    const loginElement = page.getByRole("link", {
      name: /Login|Iniciar Sesión|Sign In/i,
    });
    await expect(loginElement).toBeVisible({ timeout: 10000 });
  });

  test("should have language toggle available", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verificar que el toggle de idioma existe
    const langToggle = page.getByRole("button", { name: /Toggle language/i });
    await expect(langToggle).toBeVisible({ timeout: 10000 });
  });

  test("should have theme toggle available", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verificar que el toggle de tema existe
    const themeToggle = page.getByRole("button", { name: /Toggle theme/i });
    await expect(themeToggle).toBeVisible({ timeout: 10000 });
  });
});
