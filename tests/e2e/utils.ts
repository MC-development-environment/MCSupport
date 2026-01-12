import { Page } from "@playwright/test";

export async function isMobile(page: Page) {
  const size = page.viewportSize();
  return size ? size.width < 640 : false;
}

export async function toggleMobileMenu(page: Page) {
  if (await isMobile(page)) {
    const menuButton = page.locator("button.sm\\:hidden");
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300); // Animation wait
    }
  }
}
