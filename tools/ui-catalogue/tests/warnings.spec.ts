import { test, expect } from '@playwright/test';

test('Warnings correction preserves native confirmation, navigation and reset', async ({ page }) => {
  await page.goto('/');
  const example = page.getByRole('region', { name: 'Warnings page example', exact: true });
  const content = page.getByTestId('warning-example-content');
  const warning = content.locator('.warning-list li');
  const correction = content.getByRole('button', { name: 'Remove dependency', exact: true });
  await example.scrollIntoViewIfNeeded();
  await expect(warning).toHaveCount(1);
  await expect(warning).toContainText('Deleted predecessor');
  await expect(correction).toHaveAttribute('type', 'button');
  await expect(correction).toHaveClass('danger');
  await content.getByRole('button', { name: 'Go to TASK-002: Deleted predecessor', exact: true }).click();
  await expect(example.getByRole('status')).toHaveText('Requested Tasks: active-successor');
  page.once('dialog', async dialog => { expect(dialog.type()).toBe('confirm'); expect(dialog.message()).toBe('Remove dependency?'); await dialog.dismiss(); });
  await correction.click();
  await expect(warning).toHaveCount(1);
  page.once('dialog', async dialog => { expect(dialog.type()).toBe('confirm'); await dialog.accept(); });
  await correction.click();
  await expect(warning).toHaveCount(0);
  await expect(content.getByText('No project warnings', { exact: true })).toBeVisible();
  await example.getByRole('button', { name: 'Reset warning example', exact: true }).click();
  await expect(warning).toHaveCount(1);
  await expect(example.getByRole('status')).toHaveText('Warning example reset.');
});
