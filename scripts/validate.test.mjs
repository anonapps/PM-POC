import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

// Exercise the real CLI with disposable command doubles, never real browsers/builds.
const runner = await readFile(new URL('./validate.mjs', import.meta.url), 'utf8');
async function fixture(t, { env = {}, noNpm = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'argos-validation-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const event = name => `import {appendFileSync} from 'node:fs';appendFileSync('events.jsonl',JSON.stringify({name:${JSON.stringify(name)},args:process.argv.slice(2)})+'\\n');`;
  const files = {
    'node_modules/vitest/package.json': '{"type":"module"}',
    'node_modules/typescript/package.json': '{"type":"module"}',
    'node_modules/eslint/package.json': '{"type":"module"}',
    'node_modules/next/package.json': '{"type":"module"}',
    'node_modules/@playwright/test/package.json': '{"type":"module"}',
    'scripts/validate.mjs': runner,
    'scripts/validate.test.mjs': `${event('runner-tests')}import test from 'node:test';test('flags --passWithNoTests',()=>{});`,
    'node_modules/vitest/vitest.mjs': event('unit'),
    'node_modules/typescript/bin/tsc': event('typecheck'),
    'node_modules/eslint/bin/eslint.js': event('lint'),
    'node_modules/next/dist/bin/next': event('direct-next'),
    'e2e/run-regression.mjs': event('lifecycle'),
    'node_modules/@playwright/test/cli.js': event('layout'),
    'src/demo.test.ts': '',
    'e2e/layout/demo.spec.ts': '',
    'npm.mjs': `${event('npm')}const args=process.argv.slice(2);process.exit(Number(args[0]==='run'?process.env.FAKE_BUILD_EXIT??0:args.includes('--omit=dev')?process.env.FAKE_PRODUCTION_EXIT??0:process.env.FAKE_DEVELOPMENT_EXIT??0));`,
  };
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text);
  }
  const childEnv = { ...process.env, E2E_BASE_URL: 'http://127.0.0.1:1', npm_execpath: join(root, 'npm.mjs'), ...env };
  // Simulate an ordinary CLI, not a recursive Node test-runner subprocess.
  delete childEnv.NODE_TEST_CONTEXT;
  if (noNpm) delete childEnv.npm_execpath;
  async function run(args) {
    let stdout = '', stderr = '';
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/validate.mjs', ...args], { cwd: root, env: childEnv });
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.once('error', reject);
      child.once('close', status => resolve(status));
    });
    const events = await readFile(join(root, 'events.jsonl'), 'utf8').catch(() => '');
    const folders = await readdir(join(root, 'work')).catch(() => []);
    const summary = folders.length ? JSON.parse(await readFile(join(root, 'work', folders[0], 'summary.json'), 'utf8')) : [];
    return { code, stdout, stderr, events: events.trim().split('\n').filter(Boolean).map(line => JSON.parse(line)), summary };
  }
  return { run };
}

test('package build gate blocks browsers on failure', async t => {
  const f = await fixture(t, { env: { FAKE_BUILD_EXIT: '17' } });
  const r = await f.run(['pr']);
  assert.equal(r.code, 1);
  assert.equal(r.summary.at(-1).name, 'build');
  assert.equal(r.summary.at(-1).code, 17);
  assert.ok(r.events.some(e => e.name === 'npm' && e.args.join(' ') === 'run build'));
  assert.ok(!r.events.some(e => ['direct-next', 'lifecycle', 'layout'].includes(e.name)));
});

test('PR runs each mandatory suite once and delegates the full package build', async t => {
  const f = await fixture(t);
  const r = await f.run(['pr']);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.events.map(e => e.name), ['runner-tests', 'unit', 'typecheck', 'lint', 'npm', 'lifecycle', 'layout']);
  assert.deepEqual(r.events.find(e => e.name === 'npm').args, ['run', 'build']);
  assert.deepEqual(r.events.find(e => e.name === 'lifecycle').args, ['--full', '--skip-atlas']);
  assert.deepEqual(r.events.find(e => e.name === 'layout').args, ['test']);
  assert.match(r.stdout, /^PASS validation-runner: [^\r\n]+; # tests 1; # pass 1$/m);
});

test('production audit failure blocks release validation before the informational audit', async t => {
  const f = await fixture(t, { env: { FAKE_PRODUCTION_EXIT: '23' } });
  const r = await f.run(['release']);
  assert.equal(r.code, 1);
  assert.equal(r.summary.at(-1).name, 'production-audit');
  assert.equal(r.summary.at(-1).code, 23);
  assert.ok(!r.events.some(e => e.name === 'npm' && e.args[0] === 'audit' && !e.args.includes('--omit=dev')));
});

test('development audit remains informational with its failure retained in the summary', async t => {
  const f = await fixture(t, { env: { FAKE_DEVELOPMENT_EXIT: '23' } });
  const r = await f.run(['release']);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.summary.at(-1).name, 'development-audit');
  assert.equal(r.summary.at(-1).code, 23);
  assert.match(r.stdout, /INFO development-audit/);
});

for (const [suite, args] of [['unit', ['--passWithNoTests']], ['unit', ['--reporter', 'dot']], ['layout', ['--reporter=list']]]) {
  test(`flags alone cannot expand targeted ${suite} into a full run: ${args.join(' ')}`, async t => {
    const f = await fixture(t);
    const r = await f.run(['targeted', suite, ...args]);
    assert.notEqual(r.code, 0);
    assert.deepEqual(r.events, []);
  });
}

test('explicit unit path runs only the requested unit selection', async t => {
  const f = await fixture(t);
  const r = await f.run(['targeted', 'unit', 'src/demo.test.ts', '--reporter=dot']);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.events, [{ name: 'unit', args: ['run', 'src/demo.test.ts', '--reporter=dot'] }]);
});

test('a positive layout name filter is an explicit targeted scope', async t => {
  const f = await fixture(t);
  const r = await f.run(['targeted', 'layout', '--grep', 'demo journey']);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.events, [{ name: 'layout', args: ['test', '--grep', 'demo journey'] }]);
});

test('quick runs runner checks and domain/persistence only', async t => {
  const f = await fixture(t);
  const r = await f.run(['quick']);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.events, [{ name: 'runner-tests', args: [] }, { name: 'unit', args: ['run', 'src/domain', 'src/persistence'] }]);
});

test('full validation outside npm fails before spending any test time', async t => {
  const f = await fixture(t, { noNpm: true });
  const r = await f.run(['pr']);
  assert.notEqual(r.code, 0);
  assert.deepEqual(r.events, []);
  assert.match(r.stderr, /npm run validate/);
});
