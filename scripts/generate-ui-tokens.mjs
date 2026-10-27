import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = new URL('../src/ui/tokens.json', import.meta.url);
const destination = new URL('../src/app/ui-tokens.generated.css', import.meta.url);
const tokens = JSON.parse(await readFile(source, 'utf8'));
const lines = ['/* Generated from src/ui/tokens.json. Run npm run ui:tokens; do not edit. */', ':root {'];
const dimension = (name, value) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid dimension: ${name}`);
  lines.push(`  --ui-${name}: ${value}px;`);
};
for (const key of ['regular', 'creation', 'embedded']) dimension(`field-${key}-height`, tokens.field[key]);
dimension('field-text-line', tokens.field.textLine);
dimension('field-text-inset', tokens.field.textInset);
dimension('timeline-footer-min-height', tokens.timelineFooterMinHeight);
for (const [kind, palette] of [['task', tokens.taskStatus], ['milestone', tokens.milestoneStatus]]) {
  for (const [status, color] of Object.entries(palette)) {
    if (!/^#[\da-f]{6}$/i.test(color)) throw new Error(`Invalid ${kind} color: ${status}`);
    const name = status.toLowerCase().replaceAll(' ', '-');
    lines.push(`  --ui-status-${kind}-${name}: ${color};`);
  }
}
lines.push('}', '');
const output = lines.join('\n');
if (process.argv.includes('--check')) {
  if (await readFile(destination, 'utf8') !== output) {
    throw new Error('Generated UI tokens are stale. Run npm run ui:tokens and commit the CSS.');
  }
  console.log('UI token source and generated CSS match.');
} else {
  await writeFile(destination, output);
  console.log(`Generated ${fileURLToPath(destination)}`);
}
