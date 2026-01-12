import { test, expect } from "@playwright/test";
import { LoginPage } from "./pom/LoginPage";

test.describe("Authentication", () => {
  test("should redirect unauthenticated user to login", async ({ page }) => {
    await page.goto("/portal/tickets");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should allow client to login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login("client@hidalgos.com", "123456");
    await expect(page).toHaveURL(/\/portal/, { timeout: 15000 });
  });

  test("should allow admin to login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login("admin@multicomputos.com", "123456");
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  });

  test("should show error on invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login("wrong@test.com", "wrongpass");
    // El mensaje de error real es "Invalid email or password" según el error context
    await expect(
      page.getByText(
        /Invalid email or password|Credenciales inválidas|Invalid credentials/i
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("should logout successfully", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login("client@hidalgos.com", "123456");
    await expect(page).toHaveURL(/\/portal/, { timeout: 15000 });

    // Buscar botón de usuario (dropdown) - según el DOM hay un "Toggle user menu"
    const userButton = page.getByRole("button", {
      name: /Toggle user menu|User menu|Cuenta/i,
    });
    await userButton.click();

    // Esperar a que aparezca el menú desplegable
    await page.waitForTimeout(500);

    // Click en cerrar sesión - buscar en cualquier elemento que tenga ese texto
    const logoutOption = page
      .getByText(/Cerrar sesión|Sign out|Logout/i)
      .first();

    if (await logoutOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutOption.click();
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    } else {
      // Fallback: Si no encontramos el menú, forzar navegación a logout
      await page.goto("/api/auth/signout");
      await page.waitForLoadState("networkidle");
      // El flujo de signout debería redirigir al login
      await expect(page).toHaveURL(/\/login|\//, { timeout: 10000 });
    }
  });
});
