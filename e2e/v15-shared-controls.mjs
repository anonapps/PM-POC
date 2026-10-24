/** Browser coverage for approved v1.5 shared control corrections. */
export async function verifyV15SharedControls({ cdp, evaluate, waitFor, click, nav, setLabel, record }) {
  const key = async (name, code) => {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: code, ...(name === 'Enter' ? { text: '\r' } : {}) });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: code });
  };
  const setSearch = async (selector, value) => {
    await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});input.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  };
  for (const [module, add, field, id, prefix] of [
    ['People', 'Add Person', 'Person name', 'new-person-name', 'PERSON'],
    ['Streams', 'Add Stream', 'Stream name', 'new-stream-name', 'STREAM'],
  ]) {
    await nav(module);
    await click(`Search ${module.toLowerCase()}`);
    await setSearch('.module-search-controls input', 'no existing record matches this');
    await waitFor(`document.querySelectorAll('tbody tr').length===0`);
    await evaluate(`document.querySelector('h1').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
    await waitFor(`!document.querySelector('.module-search-controls')`);
    record(`${module}: outside click collapses Search and retains query`, await evaluate(`document.querySelector('.module-search-toolbar button').textContent.includes('Active')`));
    await click(add);
    record(`${module}: creation keeps Search disabled and Show Deleted before Add`, await evaluate(`(()=>{const search=document.querySelector('.module-search-toolbar button'),header=document.querySelector('.panel .header-actions');return search.disabled&&!document.querySelector('.module-search-controls')&&header.firstElementChild.matches('label.toggle')})()`));
    await evaluate(`document.querySelector('form[data-create-draft]').requestSubmit()`);
    await waitFor(`document.querySelector('#${id}')?.getAttribute('aria-invalid')==='true'`);
    record(`${module}: blank inline creation reports error beneath name`, await evaluate(`document.getElementById(document.querySelector('#${id}').getAttribute('aria-describedby'))?.textContent==='Name is required.'`));
    await setLabel(field, `Keyboard ${module} creation`);
    await evaluate(`document.querySelector('#${id}').focus()`);
    await key('Enter', 13);
    await waitFor(`Boolean(document.querySelector('#${id}')?.value===''&&document.activeElement?.id==='${id}'&&[...document.querySelectorAll('small[role=status]')].some(x=>x.textContent.includes('created.')))`);
    record(`${module}: successful filtered creation resets, stays open and restores focus`, await evaluate(`document.querySelectorAll('tbody tr').length>0&&document.querySelector('.module-search-toolbar button').disabled`));
    await evaluate(`document.querySelector('form[data-create-draft] button.secondary').click()`);
    await evaluate(`document.querySelector('button[aria-label="Undo"]').click()`);
    record(`${module}: one Undo removes created record`, await evaluate(`![...document.querySelectorAll('tbody input[aria-label^="Name for ${prefix}"]')].some(x=>x.value===${JSON.stringify(`Keyboard ${module} creation`)})`));
  }
  for (const [module, add] of [['Tasks','Add Task'],['Milestones','Add Milestone'],['Risk Log','Add Risk'],['Decision Log','Add Decision']]) {
    await nav(module);
    await click(add);
    record(`${module}: creation preserves disabled Search and toolbar order`, await evaluate(`document.querySelector('.module-search-toolbar button')?.disabled&&document.querySelector('.panel .header-actions')?.firstElementChild.matches('label.toggle')`));
    await evaluate(`document.querySelector('form[data-create-draft] button.secondary').click()`);
  }
  await nav('Tasks');
  await evaluate(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('TASK-002'));row.querySelector('details summary').click()})()`);
  const search='details.multi-select[open] input[type=search]';
  await setSearch(search, 'no dependency matches');
  await waitFor(`document.querySelector('details.multi-select[open]')?.textContent.includes('No matching options')`);
  await key('Escape', 27);
  await waitFor(`!document.querySelector('details.multi-select[open]')`);
  record('Predictive Escape closes immediately and returns focus to summary', await evaluate(`document.activeElement?.matches('summary')`));
  await evaluate(`document.activeElement.click()`);
  await waitFor(`document.querySelector('${search}')?.value===''`);
  record('Predictive filtering and closing preserve hidden selections', await evaluate(`Boolean(document.querySelector('details.multi-select[open] input[type=checkbox]:checked'))`));
  await setSearch(search, 'TASK-001');
  await key('ArrowDown', 40);
  record('Predictive ArrowDown focuses enabled result', await evaluate(`document.activeElement?.matches('details.multi-select[open] input[type=checkbox]:not(:disabled)')`));
  await key('Enter', 13);
  await waitFor(`!document.querySelector('details.multi-select[open] input[type=checkbox]')?.checked`);
  await key('Enter', 13);
  await waitFor(`document.querySelector('details.multi-select[open] input[type=checkbox]')?.checked`);
  await key('ArrowUp', 38);
  record('Predictive ArrowUp returns from first result to search', await evaluate(`document.activeElement?.type==='search'`));
  await key('Escape', 27);
  await click('Add Task');
  await evaluate(`document.querySelector('form details summary').click()`);
  await setSearch('form details input[type=search]', 'TASK-001');
  await key('Enter', 13);
  record('Enter in predictive search selects result without submitting creation form', await evaluate(`Boolean(document.querySelector('form details input[type=checkbox]:checked'))&&!document.body.innerText.includes('TASK-003')`));
  await evaluate(`document.querySelector('form button.secondary').click()`);

  await nav('Risk Log');
  await click('Filter risks');
  await setLabel('Level','High');
  await evaluate(`document.querySelector('h1').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
  await waitFor(`!document.querySelector('.module-filter-toolbar .filters')`);
  await click('Filter risks · Active');
  record('Outside dismissal preserves active filters when reopened', await evaluate(`document.querySelector('.module-filter-toolbar select')?.value==='High'`));
  await click('Clear filters');
  for (const [module, bodySelector, headerSelector] of [['Gantt','.gantt-body','.gantt-time-heading'],['Tube Map','.tube-body','.tube-axis']]) {
    await nav(module);
    record(`${module}: shared dotted Today marker spans full body below header`, await evaluate(`(()=>{const body=document.querySelector('${bodySelector}'),marker=body?.querySelector('.timeline-today-marker'),header=document.querySelector('${headerSelector}');if(!marker)return false;const b=body.getBoundingClientRect(),m=marker.getBoundingClientRect(),h=header.getBoundingClientRect(),style=getComputedStyle(marker);return Math.abs(m.top-b.top)<2&&Math.abs(m.bottom-b.bottom)<2&&m.top>=h.bottom-2&&style.borderLeftStyle==='dotted'&&style.borderLeftColor==='rgb(220, 38, 38)'&&style.pointerEvents==='none'})()`));
    if (module === 'Gantt') record('Gantt labels retain base padding and hierarchy indentation', await evaluate(`(()=>{const section=document.querySelector('.gantt-row.section>div'),milestone=document.querySelector('.gantt-row.milestone>div');return !!section&&!!milestone&&parseFloat(getComputedStyle(section).paddingLeft)>=8&&parseFloat(getComputedStyle(milestone).paddingLeft)>parseFloat(getComputedStyle(section).paddingLeft)})()`));
  }
}
