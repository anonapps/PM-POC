import { readFile } from 'node:fs/promises';
export async function runRegression({ evaluate, waitFor, click, nav, setLabel, record }) {
  if (!process.env.REGRESSION_PMP_PATH) return;
  await click('Close');
  await waitFor(`Boolean(document.querySelector('main.launcher'))`);
  const bytes = [...await readFile(process.env.REGRESSION_PMP_PATH)];
  await evaluate(`(async()=>{const writer=await window.__E2E_FILE__.createWritable();await writer.write(new Uint8Array(${JSON.stringify(bytes)}));await writer.close()})()`);
  const started = Date.now();
  await click('Open Project');
  await waitFor(`document.body.innerText.includes('Regression 180 records')`);
  record('180-record project opens', true, `${Date.now()-started} ms (diagnostic)`);
  for (const [module, prefix] of [['People','PERSON'],['Streams','STREAM'],['Tasks','TASK'],['Milestones','MILESTONE'],['Risk Log','RISK'],['Decision Log','DECISION']]) {
    const start = Date.now();
    await nav(module);
    await waitFor(`document.body.innerText.includes('${prefix}-030')`);
    record(`${module}: 30 records render`, await evaluate(`new Set([...document.querySelectorAll('tbody tr')].flatMap(row=>row.innerText.match(/${prefix}-\\d{3}/g)||[])).size===30`), `${Date.now()-start} ms (diagnostic)`);
  }
  await nav('Tube Map');
  record('Large Tube Map retains 12 week labels and 31 lanes', await evaluate(`document.querySelectorAll('.tube-axis span').length===12 && document.body.innerText.includes('Regression stream 30')`));
  await nav('Gantt');
  record('Large Gantt renders final task', await evaluate(`document.body.innerText.includes('Regression task 30')`));
  await nav('Search');
  await setLabel('Search by name, title or ID','DECISION-030');
  await waitFor(`document.body.innerText.includes('DECISION-030')`);
  record('Large project decision search', true);
  if (process.env.E2E_FULL_LIFECYCLE === '1') {
    for (const [module, button, label, prefix] of [['People','Add Person','Person name','PERSON'],['Streams','Add Stream','Stream name','STREAM'],['Tasks','Add Task','Task name','TASK'],['Milestones','Add Milestone','Name','MILESTONE'],['Risk Log','Add Risk','Risk title','RISK'],['Decision Log','Add Decision','Title','DECISION']]) {
      await nav(module);
      for (let i = 31; i <= 60; i++) {
        await click(button);
        await setLabel(label, `UI regression ${prefix} ${i} ñ <>&`);
        if (prefix === 'MILESTONE') await setLabel('Date', '2026-11-15');
        if (prefix === 'DECISION') await setLabel('Decision date', '2026-10-11');
        await evaluate(`document.querySelector('form')?.requestSubmit()`);
        await waitFor(`document.body.innerText.includes('${prefix}-${String(i).padStart(3,'0')}')`);
      }
      record(`${module}: creates 30 additional records through forms`, true);
    }
  }
  await click('Save Now');
  await waitFor(`document.querySelector('[role="status"]')?.textContent.startsWith('Saved')`);
  await click('Close');
  await waitFor(`Boolean(document.querySelector('main.launcher'))`);
  await click('Open Project');
  await waitFor(`document.body.innerText.includes('Regression 180 records')`);
  await nav('Decision Log');
  await waitFor(`document.body.innerText.includes('DECISION-${process.env.E2E_FULL_LIFECYCLE === '1' ? '060' : '030'}')`);
  record('Large project save/close/reopen', true);
}
