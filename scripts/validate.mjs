import { spawn } from 'node:child_process';
import { mkdir, writeFile, open, readFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { statSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const [level, suite, ...selectors] = process.argv.slice(2);
const usage = 'Usage: npm run validate:quick | npm run test:targeted -- unit <path|-t name> | npm run test:targeted -- layout <spec|--grep name> | npm run test:targeted -- volume [--full] | npm run validate:pr | npm run validate:release';
if (!['quick', 'targeted', 'pr', 'release'].includes(level)) throw new Error(usage);
if (level === 'targeted' && (!['unit', 'layout', 'volume'].includes(suite) || (suite !== 'volume' && selectors.length === 0))) throw new Error(usage);
// Require the scope first: reporter/output flags must never imply the whole suite.
function hasTargetedScope() {
  const first = selectors[0];
  if (!first) return false;
  const nameFlags = suite === 'unit' ? ['-t', '--testNamePattern'] : ['-g', '--grep'];
  if (nameFlags.includes(first)) return Boolean(selectors[1]?.trim() && !selectors[1].startsWith('-'));
  if (nameFlags.some(flag => first.startsWith(`${flag}=`) && first.slice(flag.length + 1).trim())) return true;
  if (first.startsWith('-')) return false;
  const root = resolve(suite === 'unit' ? 'src' : 'e2e/layout');
  for (const candidate of [resolve(first), resolve(root, first)]) {
    const path = relative(root, candidate);
    if (path === '..' || path.startsWith('../') || path.startsWith('..\\') || isAbsolute(path)) continue;
    try {
      const stat = statSync(candidate);
      if (stat.isDirectory() || (stat.isFile() && candidate.endsWith(suite === 'unit' ? '.test.ts' : '.spec.ts'))) return true;
    } catch { /* The test framework may accept the other path spelling. */ }
  }
  return false;
}
if (level === 'targeted' && suite !== 'volume' && !hasTargetedScope()) throw new Error(`Put an existing test path/directory or positive name filter first. ${usage}`);
if (level !== 'targeted' && suite) throw new Error(usage);
if (level === 'targeted' && suite === 'volume' && selectors.some(arg => arg !== '--full')) throw new Error(usage);
const npm = process.env.npm_execpath;
if (['pr', 'release'].includes(level) && !npm) throw new Error('Run full validation through npm run validate:pr or npm run validate:release');
const folder = resolve('work', `validation-${new Date().toISOString().replaceAll(':', '-')}`);
await mkdir(folder, { recursive: true });
const results = [];
const vitest = ['node_modules/vitest/vitest.mjs', 'run'];
const playwright = ['node_modules/@playwright/test/cli.js', 'test'];
let server;
let serverLog;
const env = { ...process.env };

async function run(name, args, { allowFailure = false } = {}) {
  const path = resolve(folder, `${name}.log`);
  const log = await open(path, 'w');
  const start = performance.now();
  let code;
  try {
    code = await new Promise((done, reject) => {
      const child = spawn(process.execPath, args, { env, stdio: ['ignore', log.fd, log.fd] });
      child.once('error', reject);
      child.once('close', status => done(status ?? 1));
    });
  } finally { await log.close(); }
  const output = await readFile(path, 'utf8');
  const counts = (output.match(/^[ \t]*(?:Test Files|Tests)[ \t]+[^\r\n]+|^[ \t]*\d+ passed \([^\r\n]+|^Acceptance: [^\r\n]+|^# (?:tests|pass) \d+/gm) ?? []).map(count => count.trim());
  const result = { name, seconds: Number(((performance.now() - start) / 1000).toFixed(2)), code, counts, log: path };
  results.push(result);
  await writeFile(resolve(folder, 'summary.json'), JSON.stringify(results, null, 2));
  console.log(`${code === 0 ? 'PASS' : allowFailure ? 'INFO' : 'FAIL'} ${name}: ${result.seconds}s${counts.length ? `; ${counts.join('; ')}` : ''}`);
  if (code !== 0) {
    console.error(output.split('\n').slice(-45).join('\n'));
    if (!allowFailure) throw new Error(`${name} failed; full log: ${path}`);
  }
}

async function productionServer() {
  if (env.E2E_BASE_URL) return;
  const url = 'http://127.0.0.1:3000';
  try {
    await fetch(url, { signal: AbortSignal.timeout(1000) });
    throw new Error(`Port 3000 is already in use. Set E2E_BASE_URL to intentionally reuse a server.`);
  } catch (error) { if (error.message.includes('already in use')) throw error; }
  serverLog = await open(resolve(folder, 'server.log'), 'w');
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3000'], { env, stdio: ['ignore', serverLog.fd, serverLog.fd] });
  let spawnError;
  server.once('error', error => { spawnError = error; });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null || server.signalCode !== null) throw new Error('Production server exited; see server.log');
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) { env.E2E_BASE_URL = url; return; }
    } catch {}
    await new Promise(done => setTimeout(done, 200));
  }
  throw new Error('Production server readiness timed out; see server.log');
}

try {
  if (level === 'quick') {
    await run('validation-runner', ['--test', '--test-reporter=tap', 'scripts/validate.test.mjs']);
    await run('quick', [...vitest, 'src/domain', 'src/persistence']);
  }
  else if (level === 'targeted') {
    if (suite === 'unit') await run('targeted-unit', [...vitest, ...selectors]);
    else if (suite === 'layout') await run('targeted-layout', [...playwright, ...selectors]);
    else await run('targeted-volume', ['e2e/run-regression.mjs', '--scenario=volume', ...selectors]);
  } else {
    await run('validation-runner', ['--test', '--test-reporter=tap', 'scripts/validate.test.mjs']);
    await run('unit', vitest);
    await run('typecheck', ['node_modules/typescript/bin/tsc', '--noEmit']);
    await run('lint', ['node_modules/eslint/bin/eslint.js', '.', '--max-warnings=0']);
    // Delegate to the package gate, including token checks and future build hooks.
    await run('build', [npm, 'run', 'build']);
    await productionServer();
    await run('lifecycle', ['e2e/run-regression.mjs', '--full', '--skip-atlas']);
    // Atlas runs exactly once here, alongside every other layout/release case.
    await run('layout', playwright);
    if (level === 'release') {
      await run('production-audit', [npm, 'audit', '--omit=dev', '--audit-level=moderate']);
      await run('development-audit', [npm, 'audit', '--audit-level=moderate'], { allowFailure: true });
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (server?.pid && server.exitCode === null && server.signalCode === null) {
    const closed = new Promise(done => server.once('close', done));
    server.kill('SIGTERM');
    const timer = setTimeout(() => server.kill('SIGKILL'), 2000);
    await closed;
    clearTimeout(timer);
  }
  await serverLog?.close();
  console.log(`Logs and timings: ${folder}`);
}
