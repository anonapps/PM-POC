import { globalAction } from './global-actions';
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function open(page: Page) {
  await page.addInitScript(({ bytes }) => {
    let data = new Uint8Array(bytes);
    const handle = { name: 'icon-actions.pmp', async getFile() { return { name: this.name, size: data.length, lastModified: 1, arrayBuffer: async () => data.slice().buffer }; }, async createWritable() { return { write: async (value: Uint8Array) => { data = new Uint8Array(value); }, close: async () => {} }; } };
    Object.assign(window, { showOpenFilePicker: async () => [handle], showSaveFilePicker: async () => handle });
  }, { bytes: [...readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')] });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Project', exact: true }).click();
}
async function nav(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Project modules' }).getByRole('button', { name, exact: true }).click();
}

test('compact actions render shared geometry, named icons and zero/nonzero count badges across desktop widths', async ({ page }) => {
  await open(page);
  for (const width of [900, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ['Tasks', 'Streams', 'People', 'Milestones', 'Risk Log', 'Decision Log', 'Dependencies', 'Warnings', 'Search', 'Settings']) {
      await nav(page, name);
      if (name === 'Search') await page.getByRole('searchbox', { name: 'Search names, IDs, roles, notes, status and dates' }).fill('Regression');
      const buttons = page.locator('.workspace .action-icon-button');
      if (['Tasks', 'Risk Log', 'Decision Log', 'Dependencies'].includes(name)) expect(await buttons.count()).toBeGreaterThan(0);
      const buttonStates=await buttons.evaluateAll(nodes=>nodes.map(button=>{
        const box=button.getBoundingClientRect();
        return {label:button.getAttribute('aria-label'),title:button.getAttribute('title'),icon:button.querySelector('svg')?.getAttribute('aria-hidden'),width:box.width,height:box.height,visible:box.width>0&&box.height>0};
      }));
      for(const button of buttonStates){
        expect(button.label).toMatch(/.+/);expect(button.title).toBeNull();expect(button.icon).toBe('true');
        if(button.visible){expect(button.width).toBe(36);expect(button.height).toBe(36);}
      }
      expect(await page.locator('.workspace').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
      if (name === 'Risk Log') {
        await expect(page.getByRole('button', { name: 'Actions (0)', exact: true }).first().locator('.action-icon-badge')).toHaveText('0');
        await expect(page.getByRole('button', { name: 'Actions (2)', exact: true }).first().locator('.action-icon-badge')).toHaveText('2');
        const rows = page.locator('tbody tr').filter({ has: page.locator('.action-icon-button') });
        for (const row of await rows.all()) {
          const boxes = await row.locator('.action-icon-button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().y));
          expect(new Set(boxes).size).toBe(1);
        }
      }
    }
  }
});

test('tooltips appear on delayed hover and keyboard focus, dismiss on Escape, and stay within viewport', async ({ page }) => {
  await open(page); await nav(page, 'Risk Log');
  const button = page.getByRole('button', { name: 'Actions (0)', exact: true }).first();
  await button.hover();
  await expect(page.getByRole('tooltip', { name: 'Actions (0)' })).toBeVisible();
  const tooltip = (await page.getByRole('tooltip', { name: 'Actions (0)' }).boundingBox())!;
  expect(tooltip.x).toBeGreaterThanOrEqual(0); expect(tooltip.x + tooltip.width).toBeLessThanOrEqual(1280);
  await page.mouse.move(0, 0); await expect(page.getByRole('tooltip')).toHaveCount(0);
  await button.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('tooltip', { name: 'Actions (0)' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.keyboard.press('Enter'); await expect(page.locator('.risk-actions-editor')).toBeVisible();
});

test('duplicate/delete/restore, confirmation cancellation, and disabled Undo preserve behavior', async ({ page }) => {
  await open(page);
  const undo = page.getByRole('button', { name: 'Undo', exact: true, includeHidden: true });
  await expect(undo).toBeDisabled();
  await page.keyboard.press('Alt+Shift+T');
  await page.mouse.move(0,400);
  await undo.locator('..').hover(); await expect(page.getByRole('tooltip', { name: 'Undo', exact: true })).toBeVisible();
  await page.mouse.move(0, 0); await nav(page, 'Tasks');
  const rows = page.locator('tbody tr'), before = await rows.count();
  await page.getByRole('button', { name: 'Duplicate', exact: true }).first().click();
  await expect(rows).toHaveCount(before + 1); await expect(undo).toBeEnabled();
  await globalAction(page,'Undo'); await expect(rows).toHaveCount(before);
  // The first task is a prerequisite; cancellation must retain it and its links.
  const remove = page.locator('tbody tr').filter({ has: page.getByLabel('Name for TASK-005', { exact: true }) }).getByRole('button', { name: 'Delete', exact: true });
  const cancelled = page.waitForEvent('dialog').then(async dialog => { expect(dialog.message()).toContain('depend'); await dialog.dismiss(); });
  await remove.click(); await cancelled; await expect(rows).toHaveCount(before);
  const confirmed = page.waitForEvent('dialog').then(dialog => dialog.accept());
  await remove.click(); await confirmed; await expect(rows).toHaveCount(before - 1);
  await page.getByLabel('Show Deleted', { exact: true }).check();
  await page.getByRole('button', { name: 'Restore', exact: true }).first().click();
  await page.getByLabel('Show Deleted', { exact: true }).uncheck(); await expect(rows).toHaveCount(before);
});

test('Extended Gantt retains aligned, reachable Task action icons at narrow desktop widths', async ({ page }) => {
  await open(page); await nav(page, 'Gantt');
  await page.getByRole('button', { name: 'Extended', exact: true }).click();
  const pane = page.locator('.gantt-tasks-pane');
  for (const width of [900, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const row = pane.locator('tbody tr').first(), cell = row.locator('.table-actions');
    const bounds = (await cell.boundingBox())!;
    const buttons = row.getByRole('button', { name: /^(Duplicate|Delete)$/ });
    await expect(buttons).toHaveCount(2);
    const centers: number[] = [];
    for (const button of await buttons.all()) {
      const box = (await button.boundingBox())!;
      expect(box.width).toBe(36); expect(box.height).toBe(36);
      expect(box.x).toBeGreaterThanOrEqual(bounds.x); expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      centers.push(box.y + box.height / 2);
    }
    expect(centers[0]).toBe(centers[1]);
    expect(await pane.evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
  }
});
