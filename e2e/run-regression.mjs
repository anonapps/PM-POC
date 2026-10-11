import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const folder = await mkdtemp(join(tmpdir(), 'pm-poc-regression-'));
try {
  const env = { ...process.env, REGRESSION_PMP_PATH: join(folder, 'regression.pmp'), E2E_FULL_LIFECYCLE: process.argv.includes('--full') ? '1' : '0' };
  for (const args of [['node_modules/vitest/vitest.mjs','run','src/testing/regression.test.ts'], ['e2e/acceptance.mjs']]) {
    const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) { process.exitCode = result.status || 1; break; }
  }
} finally { await rm(folder, { recursive: true, force: true }); }
