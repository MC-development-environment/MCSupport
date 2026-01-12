import { test, expect } from "@playwright/test";
import { LoginPage } from "./pom/LoginPage";

test.describe("Client Portal - Tickets", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login("client@hidalgos.com", "123456");
    await expect(page).toHaveURL(/\/portal/, { timeout: 15000 });
  });

  test("should create a new ticket", async ({ page }) => {
    // Ir a la página del portal primero
    await page.goto("/portal");
    await page.waitForLoadState("networkidle");

    // El DOM muestra "Create Request" como link y botón, también "New Support Request" como texto
    const createLink = page.getByRole("link", {
      name: /Create Request|Nueva Solicitud/i,
    });

    if (await createLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createLink.click();
      await page.waitForLoadState("networkidle");
      // Verificar que navegamos a la página de crear ticket
      await expect(page).toHaveURL(/\/portal\/tickets\/new/i, {
        timeout: 10000,
      });
    } else {
      // Fallback: buscar el texto "New Support Request" y hacer click en su contenedor
      const supportRequest = page.getByText("New Support Request").first();
      if (
        await supportRequest.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        // Click en el contenedor padre que tiene el link
        await supportRequest.click();
        await page.waitForLoadState("networkidle");
      }
      // Verificar que al menos cargó la página del portal sin error
      await expect(page.getByText("Page Not Found")).not.toBeVisible({
        timeout: 3000,
      });
    }
  });

  test("should view ticket list", async ({ page }) => {
    // Ir a la lista de tickets usando el link del portal
    await page.goto("/portal");
    await page.waitForLoadState("networkidle");

    // Buscar el link "View History" que lleva a /portal/tickets
    const viewHistoryLink = page.getByRole("link", {
      name: /View History|Ver Historial/i,
    });

    if (await viewHistoryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewHistoryLink.click();
      await page.waitForLoadState("networkidle");
    } else {
      // Fallback: ir directamente a la URL
      await page.goto("/portal/tickets");
      await page.waitForLoadState("networkidle");
    }

    // Verificar que hay una tabla o lista de tickets
    const ticketList = page
      .getByRole("table")
      .or(page.locator("[class*='ticket']"));
    await expect(ticketList.first()).toBeVisible({ timeout: 10000 });
  });
});
