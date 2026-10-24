export async function verifyV15Batch({cdp,evaluate,waitFor,click,nav,setLabel,record}) {
  const key=async(name,code,modifiers=0)=>{
    await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,windowsVirtualKeyCode:code,modifiers,...(name==='Enter'?{text:'\r'}:{})});
    await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name,windowsVirtualKeyCode:code,modifiers});
  };
  const search=async(selector,value)=>{
    await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  };
  for(const moduleName of ['Search','Streams','People','Tasks','Milestones','Risk Log','Decision Log','Warnings']) {
    await nav(moduleName);
    record(`${moduleName}: exactly one shared Search/Filter trigger`,await evaluate(`document.querySelectorAll('.shared-search-filter>button').length===1&&!!document.querySelector('.shared-search-filter svg')`));
    if(!await evaluate(`Boolean(document.querySelector('.shared-search-filter input[type=search]'))`))await evaluate(`document.querySelector('.shared-search-filter>button').click()`);
    await search('.shared-search-filter input[type=search]','retained search');
    await key('Escape',27);
    await waitFor(`!document.querySelector('.module-search-controls')`);
    record(`${moduleName}: Escape closes popover and restores trigger focus`,await evaluate(`document.activeElement===document.querySelector('.shared-search-filter>button')`));
    await evaluate(`document.querySelector('.shared-search-filter>button').click()`);
    record(`${moduleName}: reopening retains active query`,await evaluate(`document.querySelector('.shared-search-filter input[type=search]')?.value==='retained search'`));
    await click('Clear search and filters');
  }
  await nav('Tasks');
  const baseline=await evaluate(`Array.from(document.querySelectorAll('.tasks-table tbody tr'),row=>({status:row.querySelector('select[aria-label^="Status"]')?.value,owner:row.querySelector('summary[aria-label^="Owner"]')?.dataset.value||'unassigned'}))`);
  const statuses=[...new Set(baseline.map(x=>x.status))].slice(0,2),owner=baseline.find(x=>x.owner!=='unassigned').owner;
  await click('Search tasks');
  for(const status of statuses)await evaluate(`([...document.querySelectorAll('.filter-category input')].find(x=>x.getAttribute('aria-label')===${JSON.stringify(`Filter Status: ${status}`)})).click()`);
  const expectedOr=baseline.filter(x=>statuses.includes(x.status)).length;
  await waitFor(`document.querySelectorAll('.tasks-table tbody tr').length===${expectedOr}`);
  record('Record filters OR multiple statuses within one category',true);
  await evaluate(`(()=>{const field=[...document.querySelectorAll('.filter-category')].find(x=>x.querySelector('legend')?.textContent==='Owner');const option=[...field.querySelectorAll('label')].find(label=>label.querySelector('input')&&!label.textContent.includes('Unassigned'));option.querySelector('input').click()})()`);
  const expectedAnd=baseline.filter(x=>statuses.includes(x.status)&&x.owner===owner).length;
  await waitFor(`document.querySelectorAll('.tasks-table tbody tr').length===${expectedAnd}`);
  record('Record filters AND owner with selected statuses',true);
  await evaluate(`document.querySelector('.filter-category input[type=search]').focus()`);await key('Escape',27);
  await waitFor(`!document.querySelector('.module-search-controls')`);record('Escape from nested predictive filter closes shared popover',true);
  await nav('People');await nav('Tasks');
  record('Navigation resets search, filters and Show Deleted',await evaluate(`document.querySelectorAll('.tasks-table tbody tr').length===${baseline.length}&&!document.querySelector('.shared-search-filter>button').textContent.includes('Active')&&!document.querySelector('.panel .header-actions input').checked`));
  // Predictive owner selection uses human-readable ID, keyboard, and a single undoable edit.
  await evaluate(`document.querySelector('summary[aria-label="Owner for TASK-005"]').click()`);
  const ownerSearch='.predictive-select[open] input[type=search]';
  await search(ownerSearch,'PERSON-001');
  await waitFor(`document.querySelectorAll('.predictive-select[open] input[type=radio]').length===1`);
  await key('ArrowDown',40);await key('Enter',13);
  await waitFor(`!document.querySelector('.predictive-select[open]')`);
  record('Owner search resolves human ID and keyboard selection restores focus',await evaluate(`document.activeElement?.getAttribute('aria-label')==='Owner for TASK-005'&&document.activeElement.textContent.includes('Regression person')`));
  await evaluate(`document.querySelector('summary[aria-label="Owner for TASK-005"]').click()`);
  await search(ownerSearch,'PERSON-001');await key('Enter',13);
  await waitFor(`!document.querySelector('.predictive-select[open]')`);
  record('Enter on the current predictive option closes without another edit',true);
  await evaluate(`document.querySelector('button[aria-label="Undo"]').click()`);
  await evaluate(`document.querySelector('summary[aria-label="Owner for TASK-005"]').click()`);
  await waitFor(`document.querySelector('${ownerSearch}')?.value===''`);
  record('Owner dropdown clears query on close and Undo restores assignment',await evaluate(`document.querySelector('summary[aria-label="Owner for TASK-005"]').dataset.value===''`));
  await key('Escape',27);
  await nav('Risk Log');
  const riskLevels=await evaluate(`[...document.querySelectorAll('tbody .risk-level-chip')].map(x=>x.textContent)`);
  await click('Search risks');
  await evaluate(`document.querySelector('input[aria-label="Filter Level: High"]').click()`);
  await evaluate(`document.querySelector('input[aria-label="Filter Level: Medium"]').click()`);
  await waitFor(`document.querySelectorAll('tbody .risk-level-chip').length===${riskLevels.filter(level=>level==='High'||level==='Medium').length}`);
  record('Risk levels use OR within the shared multi-select category',true);
  await evaluate(`document.querySelector('.risk-matrix button.severity-low').click()`);
  await waitFor(`document.querySelectorAll('tbody .risk-level-chip').length===${riskLevels.filter(level=>level==='Low').length}`);
  record('Risk matrix and toolbar share the same Level filter state',await evaluate(`document.querySelector('input[aria-label="Filter Level: Low"]').checked&&!document.querySelector('input[aria-label="Filter Level: High"]').checked&&!document.querySelector('input[aria-label="Filter Level: Medium"]').checked`));
  await click('Clear search and filters');
  await evaluate(`document.querySelector('.shared-search-filter>button').click()`);
  await nav('Risk Log');
  await evaluate(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('RISK-002'));[...row.querySelectorAll('button')].find(b=>b.textContent==='Edit context').click()})()`);
  const riskSelections=await evaluate(`document.querySelector('.risk-context-editor .relationship-picker summary').textContent`);
  await evaluate(`document.querySelector('.risk-context-editor .relationship-picker summary').click()`);
  await search('.risk-context-editor .relationship-picker[open] input[type=search]','STREAM-003');
  await waitFor(`document.querySelectorAll('.risk-context-editor .relationship-picker[open] input[type=checkbox]').length===1`);
  await key('ArrowDown',40);await key('Enter',13);
  await search('.risk-context-editor .relationship-picker[open] input[type=search]','no match');
  await key('Escape',27);
  record('Context filtering by human ID retains hidden relationship selections',await evaluate(`document.querySelector('.risk-context-editor .relationship-picker summary').textContent.includes('selected')`));
  await evaluate(`document.querySelector('.risk-context-editor button.secondary').click()`);
  await evaluate(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('RISK-002'));[...row.querySelectorAll('button')].find(b=>b.textContent==='Edit context').click()})()`);
  record('Context Cancel restores the original relationship selections',await evaluate(`document.querySelector('.risk-context-editor .relationship-picker summary').textContent===${JSON.stringify(riskSelections)}`));
  await evaluate(`(()=>{const input=document.querySelector('.risk-context-editor textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'Risk hidden narrative');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()})()`);
  await key('Enter',13,2);await waitFor(`!document.querySelector('.risk-context-editor')`);
  await click('Search risks');await search('.shared-search-filter input[type=search]','risk hidden narrative');
  await waitFor(`document.querySelectorAll('tbody tr').length===1`);record('Risk optional context supports multiline keyboard save and hidden-field search',true);
  // Edit relationships and hidden text, submit a multiline context with Ctrl+Enter, save/reopen.
  await nav('Decision Log');
  await evaluate(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('DECISION-001'));[...row.querySelectorAll('button')].find(b=>b.textContent==='Edit context').click()})()`);
  for(const [label,id] of [['Decision tasks','TASK-004'],['Decision risks','RISK-005']]) {
    await evaluate(`([...document.querySelectorAll('.decision-context-editor .relationship-picker summary')].find(x=>x.textContent.startsWith(${JSON.stringify(label)}))).click()`);
    await search('.decision-context-editor .relationship-picker[open] input[type=search]',id);
    await key('ArrowDown',40);await key('Enter',13);await key('Escape',27);
  }
  await evaluate(`(()=>{const text=document.querySelector('.decision-context-notes textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(text,${JSON.stringify('Hidden search narrative\nSecond line')});text.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await evaluate(`document.querySelector('.decision-context-notes textarea').focus()`);await key('Enter',13,2);
  await waitFor(`!document.querySelector('.decision-context-editor')`);
  await click('Search decisions');await search('.shared-search-filter input[type=search]','hidden narrative');
  await waitFor(`document.querySelectorAll('tbody tr').length===1`);
  record('Decision module searches hidden multiline context',await evaluate(`document.querySelector('tbody tr').innerText.includes('DECISION-001')`));
  await click('Save Now');await waitFor(`document.querySelector('.save-state')?.textContent.startsWith('Saved')`);
  await nav('File Information');await click('Close Project');await waitFor(`Boolean(document.querySelector('main.launcher'))`);await click('Open Project');await waitFor(`Boolean(document.querySelector('nav'))`);
  await nav('Search');await setLabel('Search names, IDs, roles, notes, status and dates','hidden narrative');await waitFor(`[...document.querySelectorAll('.search-result-row')].some(row=>row.textContent.includes('DECISION-001'))`);
  record('Hidden context survives PMP save/reopen and matches global search',true);
  await nav('Decision Log');
  await evaluate(`(()=>{const row=[...document.querySelectorAll('tbody tr')].find(r=>r.innerText.includes('DECISION-001'));[...row.querySelectorAll('button')].find(b=>b.textContent==='Edit context').click()})()`);
  record('New Task and Risk context relationships survive PMP save/reopen',await evaluate(`['TASK-004','RISK-005'].every(id=>[...document.querySelectorAll('.decision-context-editor .relationship-picker label')].some(label=>label.textContent.includes(id)&&label.querySelector('input')?.checked))`));
  await evaluate(`document.querySelector('.decision-context-editor .actions button.secondary').click()`);

}
