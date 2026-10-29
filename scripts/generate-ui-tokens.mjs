import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = new URL('../src/ui/tokens.json', import.meta.url);
const destination = new URL('../src/app/ui-tokens.generated.css', import.meta.url);
const tokens = JSON.parse(await readFile(source, 'utf8'));
const lines = ['/* Generated from src/ui/tokens.json. Run npm run ui:tokens; do not edit. */', ':root {'];
const coreColorNames = ['canvas', 'surface', 'surfaceSubtle', 'text', 'textMuted', 'border', 'controlBorder', 'primary', 'primaryHover', 'primaryActive', 'sidebar', 'focus'];
if (Object.keys(tokens.coreColor).length !== coreColorNames.length || coreColorNames.some(name => !Object.hasOwn(tokens.coreColor, name))) {
  throw new Error('Core color roles must match the compatibility contract.');
}
for (const name of coreColorNames) {
  const color = tokens.coreColor[name];
  if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) throw new Error(`Invalid core color: ${name}`);
  const kebabName = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  lines.push(`  --ui-color-${kebabName}: ${color};`);
}
const dimension = (name, value) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid dimension: ${name}`);
  lines.push(`  --ui-${name}: ${value}px;`);
};
const requireKeys = (value, names, family) => {
  if (!value || Object.keys(value).length !== names.length || names.some(name => !Object.hasOwn(value, name))) {
    throw new Error(`Invalid ${family} role set.`);
  }
};
requireKeys(tokens.typography, ['app', 'baseline'], 'typography');
for (const [family, prefix, names] of [
  ['app', 'type', ['display', 'kpi', 'section', 'body', 'control', 'caption']],
  ['baseline', 'text', ['xs', 'sm', 'base', 'section', 'page', 'display']],
]) {
  const scale = tokens.typography[family];
  requireKeys(scale, names, `typography ${family}`);
  for (const name of names) {
    const value = scale[name];
    if (typeof value !== 'string' || !/^(?:\d+(?:\.\d+)?|\.\d+)rem$/.test(value) || parseFloat(value) <= 0) {
      throw new Error(`Invalid typography ${family} ${name}`);
    }
    lines.push(`  --ui-${prefix}-${name}: ${value};`);
  }
}
requireKeys(tokens.spacing, ['1', '2', '3', '4', '6', '8', '12', '16'], 'spacing');
for (const [name, value] of Object.entries(tokens.spacing)) dimension(`space-${name}`, value);
requireKeys(tokens.radius, ['control', 'card', 'dialog'], 'radius');
for (const [name, value] of Object.entries(tokens.radius)) dimension(`radius-${name}`, value);
requireKeys(tokens.action, ['height', 'radius', 'font', 'insetBlock', 'insetInline', 'weight', 'lineHeight'], 'action');
for (const name of ['height', 'radius', 'insetBlock', 'insetInline']) {
  dimension(`action-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, tokens.action[name]);
}
if (tokens.action.font !== 'var(--type-control)' || !Number.isInteger(tokens.action.weight) || tokens.action.weight < 1 || tokens.action.weight > 1000 || !Number.isFinite(tokens.action.lineHeight) || tokens.action.lineHeight <= 0) {
  throw new Error('Invalid action typography.');
}
lines.push(`  --ui-action-font: ${tokens.action.font};`, `  --ui-action-weight: ${tokens.action.weight};`, `  --ui-action-line-height: ${tokens.action.lineHeight};`);
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
