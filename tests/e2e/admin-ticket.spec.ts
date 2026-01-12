import { expect, test } from "@playwright/test";
import { LoginPage } from "./pom/LoginPage";

test.describe("Admin Console - Tickets", () => {
  // Configurar retries para tests de admin que pueden ser flaky en Firefox
  test.describe.configure({ retries: 2 });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login("admin@multicomputos.com", "123456");
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  });

  test("should load dashboard KPIs", async ({ page }) => {
    // Esperar a que el dashboard cargue completamente
    await page.waitForLoadState("domcontentloaded");

    // Verificar que existen tarjetas de estadísticas
    const statsCards = page.locator(".rounded-xl.border, [class*='card']");
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("should view ticket list and navigate to detail", async ({ page }) => {
    // Navegar a la lista de tickets
    await page.goto("/admin/tickets");

    // Usar domcontentloaded en lugar de networkidle para evitar timeouts
    await page.waitForLoadState("domcontentloaded");

    // Esperar a que la tabla de tickets cargue
    const ticketTable = page.getByRole("table");
    await expect(ticketTable).toBeVisible({ timeout: 15000 });

    // Esperar a que las filas del tbody estén presentes
    const tableBody = ticketTable.locator("tbody");
    await expect(tableBody.locator("tr").first()).toBeVisible({
      timeout: 10000,
    });

    // Buscar primer link en la tabla
    const ticketLink = page.locator("a[href*='admin/tickets/cm']").first();

    // Esperar a que el link esté visible
    await expect(ticketLink).toBeVisible({ timeout: 10000 });

    // Scroll y click
    await ticketLink.scrollIntoViewIfNeeded();
    await ticketLink.click({ force: true });

    // NO usar networkidle - solo verificar la URL cambió
    await expect(page).toHaveURL(/admin\/tickets\/cm/, { timeout: 20000 });
  });
});
