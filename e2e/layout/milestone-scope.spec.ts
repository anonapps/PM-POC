import { globalAction } from './global-actions';
import { test, expect, type Page } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { deserializeProject, serializeProject } from '../../src/persistence/pmp/codec';

const decoded = deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));
if (!decoded.ok) throw new Error('Invalid legacy fixture');
const fixture = decoded.value;
const streams = fixture.projectState.streams.slice(0, 12).map((stream, index) => ({ ...stream, name: `Stream ${index + 1}` }));
const milestones = fixture.projectState.milestones.slice(0, 3).map((milestone, index) => ({
  ...milestone, name: ['Scope layout — One scope', 'Scope layout — Several scopes', 'Scope layout — Many scopes'][index],
  scope: { kind: 'streams' as const, streamIds: streams.slice(0, [1, 4, 12][index]).map(stream => stream.id) },
}));
const encoded = serializeProject({ ...fixture.projectState, streams: fixture.projectState.streams.map(stream => streams.find(item => item.id === stream.id) ?? stream), milestones: fixture.projectState.milestones.map(milestone => milestones.find(item => item.id === milestone.id) ?? milestone) }, { createdAt: fixture.manifest.createdAt, lastSavedAt: fixture.manifest.lastSavedAt, runtimeVersion: '1.7.0' });
if (!encoded.ok) throw new Error('Invalid scope fixture');
const bytes = [...encoded.value];

async function open(page: Page) {
  await page.addInitScript(({ bytes }) => {
    let data = new Uint8Array(bytes);
    const handle = { name: 'milestone-scope.pmp', async getFile() { return { name: this.name, size: data.length, lastModified: 1, arrayBuffer: async () => data.slice().buffer }; }, async createWritable() { return { write: async (value: Uint8Array) => { data = new Uint8Array(value); }, close: async () => {} }; } };
    Object.assign(window, { showOpenFilePicker: async () => [handle], showSaveFilePicker: async () => handle });
  }, { bytes });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Project', exact: true }).click();
  await page.getByRole('navigation', { name: 'Project modules' }).getByRole('button', { name: 'Milestones', exact: true }).click();
}

// The prior column allocation, applied only in this browser for a same-fixture
// before/after comparison. Neither pill styles nor canonical data are changed.
const priorColumns = `
@container (min-width:601px) {
 .workspace.module-milestones>.panel>table.milestones-table th:first-child,
 .workspace.module-milestones>.panel>table.milestones-table th:nth-child(4) { width:auto; }
 .workspace.module-milestones>.panel>table.milestones-table th:last-child { width:10.285714%; }
}
@container (min-width:601px) and (max-width:1350px) {
 .workspace.module-milestones>.panel>table.milestones-table th:first-child { width:23%; }
 .workspace.module-milestones>.panel>table.milestones-table th:last-child { width:16%; }
}`;

for (const width of [1024, 1280, 1440, 1920]) test(`Milestones Scope gains half its width without changing other columns at ${width}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await open(page);
  await page.getByRole('searchbox', { name: 'Search milestones', exact: true }).fill('Scope layout');
  const table = page.locator('.milestones-table');
  const rows = milestones.map(milestone => table.locator('tbody tr').filter({ has: page.getByLabel(`Name for ${milestone.humanId}`, { exact: true }) }));
  const columns = () => table.locator('thead th').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
  const heights = async () => Promise.all(rows.map(async row => (await row.boundingBox())!.height));
  const pillStyles = () => rows[2].locator('.scope-pill').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return { color: style.color, background: style.backgroundColor, radius: style.borderRadius, font: style.font, padding: style.padding, height: node.getBoundingClientRect().height };
  }));
  const legacy = await page.addStyleTag({ content: priorColumns });
  const before = { columns: await columns(), heights: await heights(), pills: await pillStyles() };
  if (width === 1440) { mkdirSync('docs/media/milestone-scope', { recursive: true }); await page.screenshot({ path: 'docs/media/milestone-scope/before-1440.png' }); }
  await legacy.evaluate(node => node.parentNode?.removeChild(node));
  const after = { columns: await columns(), heights: await heights(), pills: await pillStyles() };
  expect(after.columns[3] / before.columns[3]).toBeGreaterThan(1.45);
  expect(after.columns[3] / before.columns[3]).toBeLessThan(1.55);
  expect(after.columns[0]).toBeLessThan(before.columns[0]);
  for (const column of [1, 2, 4, 5, 6]) expect(Math.abs(after.columns[column] - before.columns[column])).toBeLessThanOrEqual(1);
  expect(after.pills).toEqual(before.pills);
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    await expect(row.locator('.scope-pill')).toHaveCount(1);
    await expect(row.locator('.scope-overflow-pill')).toHaveCount(index === 0 ? 0 : 1);
    if (index > 0) await expect(row.locator('.scope-overflow-pill')).toHaveText(`+${[1, 4, 12][index] - 1}`);
    expect(after.heights[index]).toBeLessThanOrEqual(before.heights[index]);
    const geometry = await row.locator(':scope>td').evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { left: rect.left, width: rect.width }; }));
    const headings = await table.locator('thead th').evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { left: rect.left, width: rect.width }; }));
    expect(geometry).toEqual(headings);
    const summary = row.locator('.scope-summary');
    await expect(summary).toHaveCSS('flex-wrap', 'nowrap');
    await expect(summary).toHaveCSS('gap', '4px');
    const bounds = (await row.locator(':scope>td').nth(3).boundingBox())!;
    for (const pill of await row.locator('.scope-pill').all()) {
      const box = (await pill.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(bounds.x);
      expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
    }
    for (const label of ['Duplicate', 'Delete']) {
      const button = row.getByRole('button', { name: label, exact: true });
      const box = (await button.boundingBox())!, cell = (await row.locator('.table-actions').boundingBox())!;
      expect(box.width).toBe(36); expect(box.height).toBe(36);
      expect(box.x + box.width).toBeLessThanOrEqual(cell.x + cell.width + 1);
    }
  }
  expect(after.heights[2]).toBe(before.heights[2]);
  expect(after.heights[2]).toBe(after.heights[0]);
  expect(await page.locator('.workspace').evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  expect(await table.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  if (width === 1440) await page.screenshot({ path: 'docs/media/milestone-scope/after-1440.png' });
  await info.attach('scope-column-comparison', { body: JSON.stringify({ width, before, after }, null, 2), contentType: 'application/json' });
  await rows[0].locator('.scope-summary').click();
  const choice = page.getByRole('checkbox', { name: 'Stream 2', exact: true });
  await choice.check();
  await page.keyboard.press('Escape');
  await expect(rows[0].locator('.scope-pill')).toHaveCount(1);
  await expect(rows[0].locator('.scope-overflow-pill')).toHaveText('+1');
  await globalAction(page,'Undo');
  await expect(rows[0].locator('.scope-pill')).toHaveCount(1);
  await expect(rows[0].locator('.scope-overflow-pill')).toHaveCount(0);
});
