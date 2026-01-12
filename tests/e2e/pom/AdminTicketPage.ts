import { type Page, type Locator } from "@playwright/test";

export class AdminTicketPage {
  readonly page: Page;
  readonly statusSelect: Locator;
  readonly prioritySelect: Locator;
  readonly assigneeSelect: Locator;
  readonly updateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Selectors need to be adjusted based on actual implementation of Shadcn Select or native select
    this.statusSelect = page.getByLabel("Status");
    this.prioritySelect = page.getByLabel("Prioridad");
    this.assigneeSelect = page.getByLabel("Asignado a");
    this.updateButton = page.getByRole("button", {
      name: /Actualizar|Guardar/i,
    });
  }

  async goto(ticketId: string) {
    await this.page.goto(`/admin/tickets/${ticketId}`);
  }

  async updateStatus(status: string) {
    // Assuming Shadcn Select interaction
    await this.statusSelect.click();
    await this.page.getByRole("option", { name: status }).click();
    await this.updateButton.click();
  }

  async updatePriority(priority: string) {
    await this.prioritySelect.click();
    await this.page.getByRole("option", { name: priority }).click();
    await this.updateButton.click();
  }

  async assignTo(userName: string) {
    await this.assigneeSelect.click();
    await this.page.getByRole("option", { name: userName }).click();
    await this.updateButton.click();
  }
}
