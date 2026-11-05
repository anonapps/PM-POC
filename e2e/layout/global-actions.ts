import { expect, type Page } from '@playwright/test';

export async function globalAction(page: Page, name: 'Save Now' | 'Undo' | 'Redo') {
  await page.locator('.sidebar-save-dot').click();
  await page.keyboard.press('Alt+Shift+T');
  const toolbar = page.getByRole('toolbar', { name: 'Project actions' });
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole('button', { name, exact: true }).click();
  await page.keyboard.press('Escape');
}
