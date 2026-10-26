import { spawnSync } from 'node:child_process';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const allowed = new Set(['--full', '--scenario=core', '--scenario=volume', '--skip-atlas']);
if (args.some(arg => !allowed.has(arg))) throw new Error('Unknown regression option');
const folder = await mkdtemp(join(tmpdir(), 'pm-poc-regression-'));
try {
  const fixture = join(folder, 'regression.pmp');
  await copyFile(new URL('../src/testing/fixtures/regression-180.pmp', import.meta.url), fixture);
  const env = { ...process.env, REGRESSION_PMP_PATH: fixture, E2E_FULL_LIFECYCLE: args.includes('--full') ? '1' : '0' };
  // Unit validation checks these exact bytes against the deterministic generator.
  // Browser setup must not rerun 18 unrelated unit cases just to obtain a file.
  const result = spawnSync(process.execPath, ['e2e/acceptance.mjs', ...args.filter(arg => arg !== '--full')], { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally { await rm(folder, { recursive: true, force: true }); }
