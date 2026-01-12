import { type Page, type Locator, expect } from "@playwright/test";

export class TicketPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly prioritySelect: Locator;
  readonly submitButton: Locator;
  readonly ticketList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.getByLabel(/Asunto|Subject/i);
    this.descriptionInput = page.getByLabel(/Descripción|Description/i);
    this.prioritySelect = page.getByRole("combobox");
    this.submitButton = page.getByRole("button", {
      name: /Enviar Ticket|Submit Ticket/i,
    });
    this.ticketList = page.getByRole("table"); // Selector correcto para la tabla de tickets
  }

  async gotoCreate() {
    await this.page.goto("/portal/tickets/create");
  }

  async createTicket(title: string, description: string) {
    await this.gotoCreate();
    await this.titleInput.fill(title);
    await this.descriptionInput.fill(description);
    // await this.prioritySelect.selectOption(priority); // Si es select nativo
    // Si es shadcn select, la interacción es diferente:
    // await this.prioritySelect.click();
    // await this.page.getByLabel(priority).click();

    await this.submitButton.click();
  }

  async expectTicketInList(title: string) {
    await expect(this.ticketList).toContainText(title);
  }

  async addComment(comment: string) {
    // Navigate to valid ticket view if not already there, OR assume we are on a ticket detail page
    const commentInput = this.page.getByPlaceholder(/Escribe un comentario/i);
    const sendButton = this.page.getByRole("button", { name: /Enviar/i });

    await commentInput.fill(comment);
    await sendButton.click();
    await expect(this.page.getByText(comment)).toBeVisible();
  }
}
