import { type Page, type Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly statsCards: Locator;
  readonly ticketTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statsCards = page.locator(".rounded-xl.border.bg-card"); // Ajustar selector de tarjeta de stats
    this.ticketTable = page.getByRole("table");
  }

  async goto() {
    await this.page.goto("/admin/dashboard");
  }

  async expectKpiCardsVisible() {
    await expect(this.statsCards).not.toHaveCount(0);
  }

  async expectTicketInTable(ticketTitle: string, status: string) {
    const row = this.ticketTable.getByRole("row", { name: ticketTitle });
    await expect(row).toBeVisible();
    await expect(row).toContainText(status);
  }
}
