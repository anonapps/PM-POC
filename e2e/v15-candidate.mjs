import { readFile } from 'node:fs/promises';
export async function verifyV15Candidate({cdp,evaluate,waitFor,click,nav,record}) {
  const edit=async(selector,value,blur=true)=>{
    await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});input.focus();const proto=input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));${blur?'input.blur();':''}})()`);
  };
  const auditCount=async()=>{
    await nav('File Information');
    return evaluate(`Number([...document.querySelectorAll('p')].find(p=>/^[0-9]+ recorded events$/.test(p.textContent))?.textContent.split(' ')[0])`);
  };
  await nav('File Information');
  await evaluate(`(()=>{const control=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Enable change history'))?.querySelector('input');if(!control.checked)control.click()})()`);
  for(const [moduleName,selector] of [
    ['People','input[aria-label="Name for PERSON-001"]'],['Streams','input[aria-label="Name for STREAM-001"]'],['Tasks','input[aria-label="Name for TASK-005"]'],['Milestones','input[aria-label="Name for MILESTONE-001"]'],['Risk Log','input[aria-label="Title for RISK-001"]'],['Decision Log','input[aria-label="Title for DECISION-001"]'],
  ]) {
    const before=await auditCount();await nav(moduleName);const original=await evaluate(`document.querySelector(${JSON.stringify(selector)}).value`);
    await edit(selector,'équipe XML');await waitFor(`document.querySelector(${JSON.stringify(selector)})?.value==='Équipe XML'`);
    record(`${moduleName}: blur normalises one edit/audit event`,(await auditCount())===before+1);
    await nav(moduleName);await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.focus();e.blur()})()`);
    record(`${moduleName}: unchanged repeated blur adds no event`,(await auditCount())===before+1);
    await nav(moduleName);await evaluate(`document.querySelector('button[aria-label="Undo"]').click()`);await waitFor(`document.querySelector(${JSON.stringify(selector)})?.value===${JSON.stringify(original)}`);
    await evaluate(`document.querySelector('button[aria-label="Redo"]').click()`);await waitFor(`document.querySelector(${JSON.stringify(selector)})?.value==='Équipe XML'`);
    record(`${moduleName}: single Undo/Redo includes capitalisation`,true);
  }
  await nav('People');await edit('textarea[aria-label="Notes for PERSON-001"]','  (équipe XML)\nsecond LINE  ');
  record('People notes preserve whitespace, accents and subsequent casing on blur',await evaluate(`document.querySelector('textarea[aria-label="Notes for PERSON-001"]').value===${JSON.stringify('  (Équipe XML)\nsecond LINE  ')}`));
  const beforeProject=await auditCount();await nav('Overview');const originalProject=await evaluate(`document.querySelector('.project-name-inline strong').textContent`);
  await click('Edit Project');await edit('[role=dialog] input:not([type])','équipe PROJECT');
  record('Project Details shows normalised draft before Save',await evaluate(`document.querySelector('[role=dialog] input:not([type])').value==='Équipe PROJECT'`));
  await evaluate(`[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent==='Cancel').click()`);
  record('Project Details Cancel discards normalised draft',await evaluate(`document.querySelector('.project-name-inline strong').textContent===${JSON.stringify(originalProject)}`));
  record('Project Details Cancel creates no audit mutation',(await auditCount())===beforeProject);
  await nav('Overview');await click('Edit Project');await edit('[role=dialog] input:not([type])','équipe PROJECT');await click('Done');
  record('Project Details Save commits one normalised event',(await auditCount())===beforeProject+1);
  // The actual PDF served by the candidate must be reachable without a published release.
  record('File Information links a reachable version-matched bundled PDF',await evaluate(`(async()=>{const link=document.querySelector('[data-ui-manual=pdf]');if(!link?.textContent.includes('1.5.0-rc.1')||!link.textContent.includes('not published'))return false;const response=await fetch(link.href);const bytes=new Uint8Array(await response.arrayBuffer());return response.ok&&new TextDecoder().decode(bytes.slice(0,5))==='%PDF-'})()`));
  await nav('Tasks');await evaluate(`(()=>{const button=document.querySelector('.sidebar-toggle');if(button.getAttribute('aria-expanded')!=='true')button.click()})()`);await waitFor(`document.querySelector('.sidebar-toggle')?.getAttribute('aria-expanded')==='true'`);const positions=await evaluate(`[...document.querySelectorAll('nav button')].map(b=>b.getBoundingClientRect().top)`);
  await evaluate(`document.querySelector('.sidebar-toggle').click()`);
  record('Sidebar collapse preserves every navigation vertical position',await evaluate(`[...document.querySelectorAll('nav button')].every((b,i)=>Math.abs(b.getBoundingClientRect().top-${JSON.stringify(positions)}[i])<2)`));
  await evaluate(`document.querySelector('.sidebar-toggle').click()`);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:768,height:900,deviceScaleFactor:1,mobile:false});
  record('Narrow Project-wide pill shows ALL and exposes full focus label',await evaluate(`(()=>{const pill=[...document.querySelectorAll('.scope-pill[aria-label="Project-wide"]')].find(e=>e.getBoundingClientRect().width>0);if(!pill)return false;pill.focus();return pill.title==='Project-wide'&&pill.tabIndex===0&&getComputedStyle(pill.querySelector('.scope-pill-full')).display==='none'&&getComputedStyle(pill.querySelector('.scope-pill-short')).display!=='none'})()`));
  await cdp.send('Emulation.clearDeviceMetricsOverride');
  for(const moduleName of ['Gantt','Tube Map']){
    await nav(moduleName);
    record(`${moduleName}: Hide Empty Streams starts independently off`,await evaluate(`![...document.querySelectorAll('.chart-filter-menu input[type=checkbox]')].some(e=>e.checked)`));
    await evaluate(`document.querySelector('.chart-filter-menu input[type=checkbox]').click()`);
    record(`${moduleName}: chart/popover Hide Empty Streams controls synchronise`,await evaluate(`[...document.querySelectorAll('.title-row input[type=checkbox]')].length===2&&[...document.querySelectorAll('.title-row input[type=checkbox]')].every(e=>e.checked)`));
  }
  await click('Save Now');await waitFor(`document.querySelector('.save-state').textContent.startsWith('Saved')`);
  // Open bytes produced by the actual v1.4 serializer, not a v1.5 relabelled fixture.
  await nav('File Information');await click('Close Project');await waitFor(`Boolean(document.querySelector('main.launcher'))`);
  const bytes=[...await readFile(new URL('../src/testing/fixtures/v1.4-rich-project.pmp',import.meta.url))];
  await evaluate(`(async()=>{const writer=await window.__E2E_FILE__.createWritable();await writer.write(new Uint8Array(${JSON.stringify(bytes)}));await writer.close()})()`);
  await click('Open Project');await waitFor(`Boolean(document.querySelector('nav'))`);await nav('File Information');
  record('Real v1.4 fixture opens with legacy timezone unavailable',await evaluate(`document.body.innerText.includes('Timezone unavailable')`));
  await nav('People');record('Legacy lowercase notes are not silently normalised on load',await evaluate(`document.querySelector('textarea[aria-label="Notes for PERSON-001"]').value===${JSON.stringify('  legacy notes\nsecond LINE  ')}`));
  await edit('input[aria-label="Name for PERSON-001"]','équipe legacy QA');await click('Save Now');await waitFor(`document.querySelector('.save-state').textContent.startsWith('Saved')`);
  await nav('File Information');await click('Close Project');await waitFor(`Boolean(document.querySelector('main.launcher'))`);await click('Open Project');await waitFor(`Boolean(document.querySelector('nav'))`);
  await nav('People');record('v1.4 open/edit/save/reopen preserves edited name and untouched notes',await evaluate(`document.querySelector('input[aria-label="Name for PERSON-001"]').value==='Équipe legacy QA'&&document.querySelector('textarea[aria-label="Notes for PERSON-001"]').value===${JSON.stringify('  legacy notes\nsecond LINE  ')}`));
  for(const [moduleName,prefix] of [['People','PERSON'],['Streams','STREAM'],['Tasks','TASK'],['Milestones','MILESTONE'],['Risk Log','RISK'],['Decision Log','DECISION']]){
    await nav(moduleName);if(moduleName==='People')await evaluate(`document.querySelector('.panel .header-actions input[type=checkbox]').click()`);
    record(`v1.4 ${moduleName}: all 30 identities remain after v1.5 save`,await evaluate(`new Set([...document.querySelectorAll('tbody tr')].flatMap(row=>row.innerText.match(/${prefix}-[0-9]{3}/g)||[])).size===30`));
  }
  await nav('File Information');record('Successful legacy save adds timezone metadata and retains audit history',await evaluate(`!document.body.innerText.includes('Timezone unavailable')&&Number([...document.querySelectorAll('p')].find(p=>/^[0-9]+ recorded events$/.test(p.textContent))?.textContent.split(' ')[0])>=2`));
  // Explicit lifecycle choices: same-file discard, close Cancel/Save/Discard and save failure.
  const dirty=async(value)=>{await nav('People');await edit('input[aria-label="Name for PERSON-001"]',value);await nav('File Information');};
  await dirty('unsaved local');await click('Open Project');await waitFor(`document.querySelector('[role=dialog]')?.textContent.includes('Unsaved project changes')`);await click('Cancel');
  record('Open Cancel retains the active dirty project',await evaluate(`Boolean(document.querySelector('nav'))`));
  await click('Open Project');await waitFor(`Boolean(document.querySelector('[role=dialog]'))`);await click('Discard');await waitFor(`!document.querySelector('[role=dialog]')`);await nav('People');
  record('Open Discard reloads the saved same file',await evaluate(`document.querySelector('input[aria-label="Name for PERSON-001"]').value==='Équipe legacy QA'`));
  await dirty('saved by close');await click('Close Project');await waitFor(`Boolean(document.querySelector('[role=dialog]'))`);await click('Cancel');
  record('Close Cancel keeps workspace open',await evaluate(`Boolean(document.querySelector('nav'))`));
  await click('Close Project');await waitFor(`Boolean(document.querySelector('[role=dialog]'))`);await click('Save');await waitFor(`Boolean(document.querySelector('main.launcher'))`);await click('Open Project');await waitFor(`Boolean(document.querySelector('nav'))`);await nav('People');
  record('Close Save writes normalised edits before leaving',await evaluate(`document.querySelector('input[aria-label="Name for PERSON-001"]').value==='Saved by close'`));
  await dirty('discard by close');await click('Close Project');await waitFor(`Boolean(document.querySelector('[role=dialog]'))`);await click('Discard');await waitFor(`Boolean(document.querySelector('main.launcher'))`);await click('Open Project');await waitFor(`Boolean(document.querySelector('nav'))`);await nav('People');
  record('Close Discard leaves saved bytes unchanged',await evaluate(`document.querySelector('input[aria-label="Name for PERSON-001"]').value==='Saved by close'`));
  await dirty('retry after failure');await evaluate(`window.__RC_WRITE__=window.__E2E_FILE__.createWritable;window.__E2E_FILE__.createWritable=async()=>{throw new Error('Simulated write failure')}`);
  await click('Open Project');await waitFor(`Boolean(document.querySelector('[role=dialog]'))`);await click('Save');await waitFor(`Boolean(document.querySelector('[role=dialog] [role=alert]'))`);
  record('Failed Save keeps the decision dialog and current work',await evaluate(`Boolean(document.querySelector('nav')&&document.querySelector('[role=dialog]'))`));
  await click('Cancel');await evaluate(`window.__E2E_FILE__.createWritable=window.__RC_WRITE__;delete window.__RC_WRITE__`);await click('Save Now');await waitFor(`document.querySelector('.save-state').textContent.startsWith('Saved')`);
  record('Save recovery succeeds after restoring file access',true);
}
