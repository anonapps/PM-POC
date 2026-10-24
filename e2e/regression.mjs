import { readFile } from 'node:fs/promises';
export async function runRegression({ evaluate, waitFor, click, nav, setLabel, record }) {
  if (!process.env.REGRESSION_PMP_PATH) return;
  await nav('File Information');
  await click('Close Project');
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
  await nav('Tasks');
  await evaluate(`document.querySelector('input[aria-label="Select TASK-030"]').click()`);
  for (const direction of ['ascending', 'descending']) {
    await evaluate(`([...document.querySelectorAll('th button')].find(button=>button.textContent.trim().startsWith('Owner'))).click()`);
    await waitFor(`[...document.querySelectorAll('th')].some(th=>th.textContent.trim().startsWith('Owner')&&th.getAttribute('aria-sort')==='${direction}')`);
    record(`Task Owner sorts ${direction} by displayed Person name, missing last, preserving selection`, await evaluate(`(()=>{
      const rows=[...document.querySelectorAll('tbody tr')];
      const owners=rows.map(row=>{const owner=row.querySelector('summary[aria-label^="Owner for "]');return owner.dataset.value?owner.textContent:null});
      const assigned=owners.filter(name=>name!==null),firstMissing=owners.indexOf(null);
      const ordered=assigned.every((name,index)=>index===0||assigned[index-1].localeCompare(name,undefined,{numeric:true,sensitivity:'base'})${direction === 'ascending' ? '<=' : '>='}0);
      const stable=rows.every((row,index)=>{if(index===0||owners[index]!==owners[index-1])return true;return rows[index-1].querySelector('.task-row-id').textContent<row.querySelector('.task-row-id').textContent});
      return rows.length===30&&new Set(assigned).size===3&&assigned.length===15&&ordered&&firstMissing===15&&owners.slice(firstMissing).every(name=>name===null)&&stable&&document.querySelector('input[aria-label="Select TASK-030"]').checked&&[...document.querySelectorAll('th')].some(th=>th.textContent.trim().startsWith('Owner')&&th.getAttribute('aria-sort')==='${direction}');
    })()`));
  }
  await evaluate(`document.querySelector('input[aria-label="Select TASK-030"]').click()`);
  await click('ID');
  await nav('Tube Map');
  record('Large Tube Map retains 12 week labels and 31 lanes', await evaluate(`document.querySelectorAll('.tube-axis span').length===12 && document.querySelectorAll('.tube-line').length===31 && document.body.innerText.includes('Regression stream 30')`));
  await nav('Gantt');
  record('Large Gantt renders final task', await evaluate(`document.body.innerText.includes('Regression task 30')`));
  await nav('Search');
  await setLabel('Search names, IDs, roles, notes, status and dates','DECISION-030');
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
  await nav('File Information');
  await click('Close Project');
  await waitFor(`Boolean(document.querySelector('main.launcher'))`);
  await click('Open Project');
  await waitFor(`document.body.innerText.includes('Regression 180 records')`);
  await nav('Decision Log');
  await waitFor(`document.body.innerText.includes('DECISION-${process.env.E2E_FULL_LIFECYCLE === '1' ? '060' : '030'}')`);
  const expected = process.env.E2E_FULL_LIFECYCLE === '1' ? 60 : 30;
  for (const [module, prefix] of [['People','PERSON'],['Streams','STREAM'],['Tasks','TASK'],['Milestones','MILESTONE'],['Risk Log','RISK'],['Decision Log','DECISION']]) {
    await nav(module);
    record(`${module}: all ${expected} records survive reopen`, await evaluate(`new Set([...document.querySelectorAll('tbody tr')].flatMap(row=>row.innerText.match(/${prefix}-\\d{3}/g)||[])).size===${expected}`));
  }
  record('Large project save/close/reopen', true);
}
