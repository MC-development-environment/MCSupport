import { type Page, type Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/Correo Electrónico|Email/i);
    this.passwordInput = page.getByLabel(/Contraseña|Password/i);
    this.submitButton = page.getByRole("button", {
      name: /Iniciar Sesión|Sign In/i,
    });
    // Note: Adjust button name selector based on actual UI "Mandar un código" or "Log in"
    // Since we use magic link or credentials, we'll assume standard credentials for E2E
    this.errorAlert = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.goto();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    // Validar redirección exitosa o error
    // await this.page.waitForURL(/dashboard|portal/);
  }

  async expectError(message: string) {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(message);
  }
}
