import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { deserializeProject, serializeProject } from '../../src/persistence/pmp/codec';
import { captureSchedule } from '../../src/domain/baselines';

const decoded = deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));
if (!decoded.ok) throw new Error('Invalid fixture');
const source = decoded.value;
const history = { ...source.projectState,
  streams: source.projectState.streams.map((stream, i) => ({ ...stream, name: ['Delivery', 'Operations', 'Historical stream'][i] ?? stream.name, deletion: { isDeleted: i > 2, ...(i > 2 ? { deletedAt: '2026-10-26T12:00:00Z' } : {}) } })),
  milestones: source.projectState.milestones.map((milestone, i) => ({ ...milestone, name: ['Original checkpoint', 'Shared gate', 'Removed gate', 'Coincident checkpoint'][i] ?? milestone.name,
    plannedDate: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-27'][i] ?? '2028-01-01',
    scope: i === 1 ? { kind: 'streams' as const, streamIds: source.projectState.streams.slice(0, 2).map(stream => stream.id) } : i === 2 ? { kind: 'streams' as const, streamIds: [source.projectState.streams[2].id] } : { kind: 'project' as const },
  })),
};
const first = { id: 'original', name: 'Original plan', createdAt: '2026-10-26T12:00:00Z', snapshot: captureSchedule(history) };
const second = { ...first, id: 'revised', name: 'Revised plan', snapshot: { ...first.snapshot, items: first.snapshot.items.map(item => item.kind === 'milestone' && item.id === history.milestones[0].id ? { ...item, finishDate: '2026-11-10', startDate: '2026-11-10' } : item) } };
const current = { ...history,
  streams: history.streams.map((stream, i) => ({ ...stream, name: i === 0 ? 'Delivery current' : stream.name, deletion: { isDeleted: i > 1, ...(i > 1 ? { deletedAt: '2026-10-26T12:00:00Z' } : {}) } })),
  milestones: history.milestones.map((milestone, i) => ({ ...milestone, plannedDate: i === 0 ? '2026-11-02' : i === 3 ? '2026-12-07' : i === 1 ? '2026-11-05' : milestone.plannedDate, deletion: { isDeleted: i === 2, ...(i === 2 ? { deletedAt: '2026-10-26T12:00:00Z' } : {}) } })),
};
async function open(page: Page, baselines = true) {
  const saved = serializeProject({ ...current, baselines: baselines ? [first, second] : [] }, { createdAt: source.manifest.createdAt, lastSavedAt: source.manifest.lastSavedAt, runtimeVersion: '1.7.0' });
  if (!saved.ok) throw new Error(JSON.stringify(saved.errors));
  await page.clock.install({ time: new Date('2026-10-26T12:00:00Z') });
  await page.addInitScript(({ bytes }) => {
    let data = new Uint8Array(bytes);
    const handle = { name: 'tube-comparison.pmp', async getFile() { return { name: this.name, size: data.length, lastModified: 1, arrayBuffer: async () => data.slice().buffer }; }, async createWritable() { return { write: async (value: Uint8Array) => { data = new Uint8Array(value); }, close: async () => {} }; } };
    Object.assign(window, { showOpenFilePicker: async () => [handle], showSaveFilePicker: async () => handle, __tubeBytes: () => [...data] });
  }, { bytes: [...saved.value] });
  await page.goto('/'); await page.getByRole('button', { name: 'Open Project', exact: true }).click();
  await page.getByRole('navigation', { name: 'Project modules' }).getByRole('button', { name: 'Tube Map', exact: true }).click();
  return [...saved.value];
}
const markers = (page: Page) => page.locator('.tube-baseline-overlay-marker');
const geometry = (page: Page) => page.locator('.tube-station').evaluateAll(nodes => nodes.map(node => ({ id: node.getAttribute('data-entity-id'), left: (node as HTMLElement).style.left, top: (node as HTMLElement).style.top })));

for (const width of [900, 1280, 1440, 1920]) test(`Tube comparison switches between below and same map without moving live milestones at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); const initial = await open(page);
  const mode = page.getByRole('combobox', { name: 'Baseline milestone display', exact: true });
  await expect(mode).toBeDisabled(); await expect(mode).toHaveValue('below');
  await page.getByRole('checkbox', { name: 'Baseline milestones', exact: true }).check();
  await expect(page.getByRole('region', { name: 'Baseline milestone indicators', exact: true })).toBeVisible();
  const before = await geometry(page);
  if (width === 1440) { mkdirSync('docs/media/tube-comparison', { recursive: true }); await page.screenshot({ path: 'docs/media/tube-comparison/below.png' }); }
  await mode.selectOption('map'); await expect(markers(page)).toHaveCount(4);
  await expect(page.getByRole('region', { name: 'Baseline milestone indicators', exact: true })).toHaveCount(0);
  await expect(page.getByText('Historical stream (baseline only)', { exact: true })).toBeVisible();
  expect(await geometry(page)).toEqual(before);
  // The historical checkpoint is one day into the existing 84-day date axis.
  const checkpoint = markers(page).filter({ hasText: '2' });
  expect(await checkpoint.evaluate(node => parseFloat((node as HTMLElement).style.left))).toBeCloseTo(100 / 84);
  const historicalBox = (await checkpoint.boundingBox())!, chartBox = (await page.locator('.tube-body').boundingBox())!;
  expect(historicalBox.x + historicalBox.width / 2).toBeCloseTo(chartBox.x + chartBox.width / 84, 1);
  if (width === 1440) await page.screenshot({ path: 'docs/media/tube-comparison/same-map.png' });
  expect(await page.locator('.workspace').evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const footer = (await page.getByRole('navigation', { name: 'Tube Map date navigation', exact: true }).boundingBox())!;
  expect(footer.y + footer.height).toBeLessThanOrEqual(901);
  await page.getByRole('checkbox', { name: 'Critical Path', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Dependencies', exact: true }).uncheck();
  await mode.selectOption('below'); await expect(page.locator('.tube-connections .dependency-line')).toHaveCount(0);
  await mode.selectOption('map'); expect(await geometry(page)).toEqual(before);
  await expect(page.getByRole('checkbox', { name: 'Critical Path', exact: true })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Baseline milestones', exact: true }).uncheck(); await expect(markers(page)).toHaveCount(0); await expect(mode).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Baseline milestones', exact: true }).check(); await expect(mode).toHaveValue('map'); await expect(markers(page)).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Save Now', exact: true, includeHidden: true })).toBeDisabled();
  expect(await page.evaluate(() => (window as unknown as { __tubeBytes: () => number[] }).__tubeBytes())).toEqual(initial);
  // Live diamonds still open their existing editor and preserve cancellation.
  await page.getByRole('button', { name: 'Edit milestone Original checkpoint via diamond', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Milestone name', exact: true })).toHaveValue('Original checkpoint');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
});

test('comparison markers expose grouped historical/current details on hover and keyboard focus; baseline and date navigation update them', async ({ page }) => {
  await open(page); await page.getByRole('checkbox', { name: 'Baseline milestones', exact: true }).check();
  await page.getByRole('combobox', { name: 'Baseline milestone display', exact: true }).selectOption('map');
  const group = markers(page).filter({ hasText: '2' });
  await group.hover(); const tooltip = page.getByRole('tooltip'); await expect(tooltip).toContainText('Original checkpoint'); await expect(tooltip).toContainText('Coincident checkpoint'); await expect(tooltip).toContainText('27/10/2026'); await expect(tooltip).toContainText('02/11/2026');
  await page.mouse.move(0, 0); await group.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape'); await expect(tooltip).toHaveCount(0);
  await page.getByRole('button', { name: 'Next 4 weeks', exact: true }).click(); await expect(markers(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Previous 4 weeks', exact: true }).click(); await expect(markers(page)).toHaveCount(4);
  await page.locator('summary[aria-label="Comparison baseline"]').click(); await page.getByRole('radio', { name: 'Revised plan', exact: true }).click();
  await expect(markers(page)).toHaveCount(5); await expect(markers(page).filter({ hasText: '2' })).toHaveCount(0);
});

test('display controls stay disabled when there is no comparison baseline', async ({ page }) => {
  await open(page, false);
  await expect(page.getByRole('checkbox', { name: 'Baseline milestones', exact: true })).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Baseline milestone display', exact: true })).toBeDisabled();
  await expect(markers(page)).toHaveCount(0);
});
