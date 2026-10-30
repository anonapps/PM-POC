import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { serializeProject, deserializeProject } from '../../src/persistence/pmp/codec';
import { makeProjectState, projectFixture, streamFixture, taskFixture } from '../../src/domain/test-fixtures';
import { captureSchedule } from '../../src/domain/baselines';

function fixture(partial = false) {
 const tasks = [
  taskFixture({id:'001',humanId:'TASK-001',name:'Discovery',startDate:'2026-10-25',endDate:'2026-10-27'}),
  taskFixture({id:'002',humanId:'TASK-002',name:'Build service',startDate:'2026-10-27',endDate:'2026-10-30'}),
  taskFixture({id:'003',humanId:'TASK-003',name:'Validate service',startDate:'2026-10-27',endDate:'2026-10-30',status:'Completed'}),
  taskFixture({id:'004',humanId:'TASK-004',name:'Launch',startDate:'2026-10-30',endDate:'2026-11-03'}),
  taskFixture({id:'005',humanId:'TASK-005',name:'Documentation',startDate:'2026-10-27',endDate:'2026-10-29',scope:{kind:'stream',streamId:'docs'}}),
 ];
 if(partial)tasks.push(taskFixture({id:'006',humanId:'TASK-006',name:'Unscheduled review',startDate:null,endDate:null}));
 const state = {...makeProjectState({project:projectFixture({name:'ARGOS release',startDate:'2026-10-25',metadata:{schemaVersion:1,minimumAppVersion:'0.1.0',showProgress:false,gettingStartedCompleted:true}}),streams:[streamFixture({name:'Delivery'}),streamFixture({id:'docs',humanId:'STREAM-002',name:'Documentation'})],tasks,dependencies:[['001','002'],['001','003'],['002','004'],['003','004'],['001','005']].map(([from,to],index)=>({id:`dep-${index}`,projectId:'project-1',predecessor:{kind:'task' as const,id:from},successor:{kind:'task' as const,id:to},type:'Finish-to-Start' as const})),milestones:[{id:'milestone-1',projectId:'project-1',humanId:'MILESTONE-001',name:'Launch approved',plannedDate:'2026-11-03',status:'Planned',ownerId:null,scope:{kind:'streams',streamIds:['stream-1']},relatedTaskIds:[],deletion:{isDeleted:false}}]})};
 state.dependencies=[...state.dependencies,{id:'dep-milestone',projectId:'project-1',predecessor:{kind:'task',id:'004'},successor:{kind:'milestone',id:'milestone-1'},type:'Finish-to-Start'}];
 return {...state,baselines:[{id:'original',name:'Original plan',createdAt:'2026-10-25T00:00:00Z',snapshot:captureSchedule(state)}]};
}
async function open(page:Page,partial=false,unavailable=false,source=fixture(partial)){
 const saved=serializeProject(source,{createdAt:'2026-10-25T00:00:00Z',lastSavedAt:'2026-10-25T00:00:00Z',runtimeVersion:'1.6.0'});if(!saved.ok)throw Error(JSON.stringify(saved.errors));
 await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes);const handle={name:'critical-path-disposable.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:1,arrayBuffer:async()=>data.slice().buffer}},async createWritable(){return{write:async(value:Uint8Array)=>{data=new Uint8Array(value)},close:async()=>{}}}};Object.assign(window,{showOpenFilePicker:async()=>[handle],__saved:()=>[...data]});},{bytes:[...saved.value]});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();await expect(page.locator('.critical-path-overview')).toContainText(unavailable?'Unavailable':partial?'Provisional':'03/11/2026');
}
async function nav(page:Page,name:string){await page.locator('nav').getByRole('button',{name,exact:true}).click()}
async function analysis(page:Page){await page.getByRole('button',{name:'Open Critical Path Analysis in Gantt'}).click();await expect(page.locator('.critical-path-analysis')).toBeVisible();await expect(page.locator('.analysis-summary')).toContainText('03/11/2026')}
const taskRow=(page:Page,id:string)=>page.locator('.analysis-table tbody tr:not(.analysis-details)').filter({hasText:id});

test('current .pmp, independent controls, scope, CSV, temporary reveal and save compatibility',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await open(page);await analysis(page);
 const toggle=page.getByRole('checkbox',{name:'Critical Path',exact:true});await expect(toggle).not.toBeChecked();await toggle.check();await expect(page.locator('.gantt-bar[data-critical=true]')).not.toHaveCount(0);await expect(page.locator('.critical-path-legend')).toBeVisible();
 await expect(taskRow(page,'TASK-005')).toContainText('Noncritical');await expect(taskRow(page,'TASK-005')).toContainText('5d');
 await page.getByLabel('Calculation scope',{exact:true}).selectOption('docs');await expect(taskRow(page,'TASK-005')).toContainText('Critical');await expect(page.locator('.analysis-table tbody tr')).toHaveCount(1);
 await expect(page.locator('.gantt-row[data-entity-id="005"] .gantt-bar')).not.toHaveAttribute('data-critical','true');
 await page.getByLabel('Calculation scope',{exact:true}).selectOption('project');
 const search=page.locator('.critical-path-analysis .shared-search-filter input');await search.fill('Discovery');await expect(page.locator('.analysis-table tbody tr')).toHaveCount(1);
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV',exact:true}).click();const download=await downloadPromise;const csv=await readFile((await download.path())!,'utf8');expect(csv).toContain('TASK-005');expect(csv).toContain('Documentation');
 await search.fill('');const chartSearch=page.locator('.gantt-panel .shared-search-filter input');await chartSearch.fill('nonexistent');await expect(page.locator('.gantt-row.task')).toHaveCount(0);
 await taskRow(page,'TASK-005').getByRole('button',{name:'TASK-005 Documentation',exact:true}).click();await expect(chartSearch).toHaveValue('nonexistent');await expect(page.locator('.gantt-row.task')).toHaveCount(1);await expect(page.locator('.gantt-row.analysis-selection')).toHaveAttribute('data-entity-id','005');await expect(page.locator('.gantt-row.analysis-selection')).toContainText('Temporarily revealed');
 const range=page.getByRole('navigation',{name:'Gantt date navigation'}).locator('[data-start]');const before=await range.getAttribute('data-start');for(let step=0;step<15;step++)await page.getByRole('navigation',{name:'Gantt date navigation'}).getByRole('button',{name:'Next',exact:true}).click();const expected=new Date(before!+'T00:00:00Z');expected.setUTCDate(expected.getUTCDate()+15);await expect(range).toHaveAttribute('data-start',expected.toISOString().slice(0,10));await taskRow(page,'TASK-005').getByRole('button',{name:'TASK-005 Documentation',exact:true}).click();await expect(range).not.toHaveAttribute('data-start',expected.toISOString().slice(0,10));
 await nav(page,'Tube Map');await expect(toggle).not.toBeChecked();await toggle.check();await expect(page.locator('.tube-station-diamond[data-critical=true]')).not.toHaveCount(0);await expect(page.locator('.critical-path-legend')).toBeVisible();
 await nav(page,'Gantt');await expect(toggle).toBeChecked();await expect(page.getByRole('button',{name:'Simple',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Extended',exact:true}).click();await expect(page.getByRole('tab',{name:'Tasks',exact:true})).toHaveAttribute('aria-selected','true');
 await nav(page,'File Information');await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.getByRole('button',{name:'Open Project',exact:true}).click();await nav(page,'Gantt');await expect(toggle).not.toBeChecked();await nav(page,'Tube Map');await expect(toggle).not.toBeChecked();
 const bytes=await page.evaluate(()=>(window as unknown as {__saved:()=>number[]}).__saved());const loaded=deserializeProject(new Uint8Array(bytes));expect(loaded.ok).toBe(true);if(loaded.ok){expect(loaded.value.projectState.tasks).toEqual(fixture().tasks);expect(loaded.value.projectState.baselines).toEqual(fixture().baselines);expect(Object.keys(loaded.value.projectState).join(' ')).not.toContain('critical')}
});

test('Partial withholds unreliable values, Quick Edit commits and Undo recalculates',async({page})=>{
 await page.setViewportSize({width:1366,height:900});await open(page,true);await expect(page.locator('.critical-path-overview')).toContainText('Partial');await expect(page.locator('.critical-path-overview')).toContainText('unresolved');await analysis(page);
 await expect(taskRow(page,'TASK-006')).toContainText('Unscheduled');await expect(taskRow(page,'TASK-001')).toContainText('Unresolved');await page.getByRole('checkbox',{name:'Critical Path',exact:true}).check();await expect(page.locator('[data-critical=true]')).toHaveCount(0);
 await taskRow(page,'TASK-006').getByRole('button',{name:'Quick Edit',exact:true}).click();const editor=page.getByRole('form',{name:'Quick edit task'});await editor.getByLabel('Start date',{exact:true}).fill('2026-10-25');await editor.getByLabel('End date',{exact:true}).fill('2026-10-25');await editor.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.analysis-summary')).toContainText('Up to date');await expect(taskRow(page,'TASK-001')).toContainText('Critical');await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('.analysis-summary')).toContainText('Partial');await expect(taskRow(page,'TASK-006')).toContainText('Unscheduled');await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.locator('.analysis-summary')).toContainText('Up to date');
});
for(const size of [{width:1366,height:768},{width:1280,height:720},{width:1024,height:768},{width:900,height:700}])test(`Quick Edit fits reserved details slot at ${size.width}x${size.height}`,async({page},info)=>{
 await page.setViewportSize(size);await open(page);await analysis(page);await page.getByRole('checkbox',{name:'Critical Path',exact:true}).check();await expect(page.locator('.critical-path-legend')).toBeVisible();await taskRow(page,'TASK-001').getByRole('button',{name:'Quick Edit',exact:true}).click();const editor=page.getByRole('form',{name:'Quick edit task'});await expect(editor).toBeVisible();await editor.getByRole('button',{name:'Cancel',exact:true}).scrollIntoViewIfNeeded();
 const bounds=await editor.evaluate(e=>{const r=e.getBoundingClientRect(),copy=e.closest('.analysis-detail-grid')!.querySelector('.analysis-detail-copy')!.getBoundingClientRect(),pane=e.closest('.analysis-results')!.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,copy:{left:copy.left,right:copy.right,top:copy.top,bottom:copy.bottom},pane:{top:pane.top,bottom:pane.bottom},width:innerWidth,height:innerHeight}});
 expect(bounds.top).toBeGreaterThanOrEqual(0);expect(bounds.left).toBeGreaterThanOrEqual(0);expect(bounds.right).toBeLessThanOrEqual(bounds.width);expect(bounds.bottom).toBeLessThanOrEqual(bounds.height);expect(bounds.right<=bounds.copy.left||bounds.left>=bounds.copy.right||bounds.top>=bounds.copy.bottom||bounds.bottom<=bounds.copy.top).toBe(true);
 expect(await page.locator('.workspace').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);expect(await page.locator('.analysis-results').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);await page.screenshot({path:info.outputPath('analysis-quick-edit.png')});await editor.getByRole('button',{name:'Cancel',exact:true}).click();
});


test('worker failure leaves project usable and Retry restores derived results',async({page})=>{
 await page.addInitScript(()=>{
  const NativeWorker=window.Worker;let attempts=0;
  window.Worker=class extends NativeWorker {
   constructor(url:string|URL,options?:WorkerOptions){if(++attempts===1)throw Error('Disposable calculation failure');super(url,options)}
  };
 });
 await open(page,false,true);await page.getByRole('button',{name:'Open Critical Path Analysis in Gantt'}).click();
 await expect(page.locator('.analysis-summary')).toContainText('Unavailable');await expect(page.getByRole('button',{name:'Export CSV',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('.analysis-summary')).toContainText('Up to date');await expect(page.locator('.analysis-summary')).toContainText('03/11/2026');await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
});

// Exercise the chart's floating editor, separately from the in-flow analysis editor.
for (const lowerPanel of ['Tasks', 'Critical Path Analysis']) test(`Extended chart Quick Edit crosses ${lowerPanel} boundary and follows divider`, async ({page}) => {
 await page.setViewportSize({width:1366,height:768});await open(page);await analysis(page);
 await page.getByRole('tablist',{name:'Gantt lower panel'}).getByRole('tab',{name:lowerPanel,exact:true}).click();
 const chart=page.locator('.gantt-panel .gantt');
 const anchor=chart.locator('.gantt-row.task .sort-heading').last();
 const editor=page.getByRole('form',{name:'Quick edit task'});
 const accessible=async()=>expect.poll(()=>editor.evaluate(form=>[...form.querySelectorAll<HTMLInputElement|HTMLButtonElement>('input,button')].filter(control=>{
  const r=control.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return r.top<0||r.bottom>innerHeight||r.left<0||r.right>innerWidth||!hit||!control.contains(hit);
 }).map(control=>control.getAttribute('aria-label')??control.textContent?.trim()))).toEqual([]);
 for (const size of [{width:1366,height:768},{width:1280,height:720}]) {
  await page.setViewportSize(size);await anchor.scrollIntoViewIfNeeded();const originalHeight=(await page.locator(".gantt-pane").boundingBox())!.height;await anchor.click();await accessible();
  expect((await page.locator(".gantt-pane").boundingBox())!.height).toBeCloseTo(originalHeight,0);
  await expect.poll(()=>editor.evaluate(form=>{
   const r=form.getBoundingClientRect();
   for(let y=r.top+4;y<r.bottom-4;y+=8)for(const x of [r.left+4,r.left+r.width/2,r.right-4]){
    const hit=document.elementFromPoint(x,y);if(!hit||!form.contains(hit))return `Editor obscured at ${Math.round(x)},${Math.round(y)} by ${hit?.className}`;
   }
   return 'Unobscured';
  })).toBe('Unobscured');
  // At least part of the editor must escape the upper pane and remain hit-testable.
  const pane=(await page.locator('.gantt-pane').boundingBox())!,box=(await editor.boundingBox())!;expect(box.y+box.height).toBeGreaterThan(pane.y+pane.height);
  const separator=page.getByRole('separator');await separator.press('ArrowDown');await separator.press('ArrowDown');await accessible();
  await expect.poll(async()=>{const a=(await anchor.boundingBox())!,p=(await editor.boundingBox())!;return Math.abs(p.y-(a.y+a.height+6));}).toBeLessThan(2);
  await chart.evaluate(node=>node.scrollTop=Math.max(0,node.scrollTop-24));await accessible();
  await expect.poll(async()=>{const a=(await anchor.boundingBox())!,p=(await editor.boundingBox())!;return Math.abs(p.y-(a.y+a.height+6));}).toBeLessThan(2);
  await editor.getByLabel('Task name',{exact:true}).press('Escape');await expect(editor).toHaveCount(0);await expect(anchor).toBeFocused();
  await anchor.click();await accessible();await editor.getByRole('button',{name:'Cancel',exact:true}).click();await expect(editor).toHaveCount(0);
 }
 await anchor.click();await editor.getByLabel('Task name',{exact:true}).fill('Overlay saved task');await editor.getByRole('button',{name:'Save',exact:true}).click();await expect(editor).toHaveCount(0);await expect(anchor).toHaveText('Overlay saved task');
 await anchor.click();await editor.getByRole('button',{name:'Open Task',exact:true}).click();await expect(page.getByRole('navigation',{name:'Project modules'}).getByRole('button',{name:'Tasks',exact:true})).toHaveAttribute('aria-current','page');
 if(lowerPanel==='Tasks'){
  await nav(page,'Gantt');await expect(page.getByRole('button',{name:'Simple',exact:true})).toHaveAttribute('aria-pressed','true');
  await anchor.scrollIntoViewIfNeeded();await anchor.click();await expect(editor).not.toHaveAttribute('popover');await expect(editor).toHaveCSS('position','fixed');
  await editor.getByLabel('Task name',{exact:true}).fill('Discarded Simple edit');await editor.getByRole('button',{name:'Cancel',exact:true}).click();await expect(editor).toHaveCount(0);await expect(anchor).toHaveText('Overlay saved task');
 }
});

test('Hide Unscheduled Tasks composes chart filters across modes without changing analysis or PMP data',async({page})=>{
 const base=fixture(true),source={...base,streams:[...base.streams,streamFixture({id:'unplanned',humanId:'STREAM-003',name:'Unplanned stream'})],tasks:[...base.tasks,taskFixture({id:'007',humanId:'TASK-007',name:'Unplanned inbox',scope:{kind:'stream',streamId:'unplanned'}})],auditHistory:{enabled:true,events:[]}};
 await page.setViewportSize({width:1366,height:900});await open(page,true,false,source);
 const savedBefore=await page.evaluate(()=>(window as unknown as {__saved:()=>number[]}).__saved());
 await nav(page,'Gantt');const chart=page.locator('.gantt-panel'),taskRows=chart.locator('.gantt-row.task');
 const controls=page.getByRole('region',{name:'Search and filter controls for gantt',exact:true});
 const filters=async()=>{await chart.getByRole('button',{name:'Search and filter gantt',exact:true}).click();await expect(controls).toBeVisible()};
 const hide=controls.getByRole('checkbox',{name:'Hide Unscheduled Tasks',exact:true}),empty=controls.getByRole('checkbox',{name:'Hide Empty Streams',exact:true});
 await expect(taskRows).toHaveCount(7);await expect(page.getByRole('button',{name:'Simple',exact:true})).toHaveAttribute('aria-pressed','true');
 await chart.getByLabel('Baseline overlay',{exact:true}).check();await filters();await expect(hide).not.toBeChecked();
 expect(await empty.evaluate(input=>input.closest('label')!.nextElementSibling?.textContent?.trim())).toBe('Hide Unscheduled Tasks');
 await hide.check();await expect(taskRows).toHaveCount(5);await expect(chart.locator('.gantt-row.section[data-entity-id="unplanned"]')).toHaveCount(1);
 await empty.check();await expect(chart.locator('.gantt-row.section[data-entity-id="unplanned"]')).toHaveCount(0);
 await controls.getByRole('checkbox',{name:'Filter Task Status: Completed',exact:true}).check();await page.keyboard.press('Escape');
 const search=chart.getByRole('searchbox',{name:'Search gantt',exact:true});await search.fill('Validate');await expect(taskRows).toHaveCount(1);await expect(taskRows).toContainText('Validate service');
 await search.fill('Unscheduled');await expect(taskRows).toHaveCount(0);await filters();await controls.getByRole('button',{name:'Clear all',exact:true}).click();await expect(hide).not.toBeChecked();await expect(empty).not.toBeChecked();await expect(search).toHaveValue('');await expect(taskRows).toHaveCount(7);
 await hide.check();await empty.check();await controls.getByRole('checkbox',{name:'Hide dependencies',exact:true}).check();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Extended',exact:true}).click();await expect(taskRows).toHaveCount(5);await expect(page.locator('.gantt-tasks-pane .tasks-table tbody tr').filter({has:page.locator('.task-name-cell')})).not.toHaveCount(0);
 await page.getByRole('tablist',{name:'Gantt lower panel'}).getByRole('tab',{name:'Critical Path Analysis',exact:true}).click();
 await expect(page.locator('.analysis-table tbody tr')).toHaveCount(7);await expect(taskRow(page,'TASK-007')).toContainText('Unscheduled');const summary=await page.locator('.analysis-summary').textContent();
 await filters();await expect(hide).toBeChecked();await hide.uncheck();await expect(taskRows).toHaveCount(7);await hide.check();await expect(taskRows).toHaveCount(5);await page.keyboard.press('Escape');
 await expect(page.locator('.analysis-summary')).toHaveText(summary!);await expect(chart.getByLabel('Baseline overlay',{exact:true})).toBeChecked();await expect(chart.getByRole('checkbox',{name:'Dependencies',exact:true})).not.toBeChecked();
 // Approved temporary selection reveal must not rewrite any chart filter.
 await taskRow(page,'TASK-007').getByRole('button',{name:'TASK-007 Unplanned inbox',exact:true}).click();await expect(chart.locator('.gantt-row.task[data-entity-id="007"]')).toContainText('Temporarily revealed');
 await filters();await expect(hide).toBeChecked();await page.keyboard.press('Escape');await search.press('Escape');await expect(chart.locator('.gantt-row.task[data-entity-id="007"]')).toHaveCount(0);
 await page.getByRole('tablist',{name:'Gantt lower panel'}).getByRole('tab',{name:'Tasks',exact:true}).click();await expect(taskRows).toHaveCount(5);
 await filters();await controls.getByRole('button',{name:'Clear all',exact:true}).click();await expect(hide).not.toBeChecked();await expect(taskRows).toHaveCount(7);await page.keyboard.press('Escape');await expect(chart.getByRole('checkbox',{name:'Dependencies',exact:true})).toBeChecked();
 await filters();await hide.check();await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
 await nav(page,'File Information');await expect(page.getByText('0 recorded events',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.getByRole('button',{name:'Open Project',exact:true}).click();
 await nav(page,'Gantt');await filters();await expect(hide).not.toBeChecked();await expect(taskRows).toHaveCount(7);
 const savedAfter=await page.evaluate(()=>(window as unknown as {__saved:()=>number[]}).__saved());expect(savedAfter).toEqual(savedBefore);
});

for(const height of [768,1000])test(`Analysis selection reveals only upper Gantt at height ${height}`,async({page})=>{
 const base=fixture();
 const source={...base,tasks:[...base.tasks,...Array.from({length:45},(_,i)=>taskFixture({id:`extra-${i}`,humanId:`TASK-${100+i}`,name:`Extra task ${i}`,startDate:'2026-10-25',endDate:'2026-10-27'})),taskFixture({id:'unscheduled',humanId:'TASK-999',name:'Unscheduled target',startDate:'2030-01-01',endDate:null,scope:{kind:'stream',streamId:'docs'}})]};
 await page.setViewportSize({width:1366,height});await open(page,false,false,source);await analysis(page);
 const chart=page.locator('.gantt-panel .gantt'),results=page.locator('.analysis-results'),search=page.locator('.critical-path-analysis .shared-search-filter input');
 const snapshot=()=>page.evaluate(()=>({page:window.scrollY,workspace:document.querySelector('.workspace')!.scrollTop,lower:document.querySelector('.gantt-tasks-pane')!.scrollTop,results:document.querySelector('.analysis-results')!.scrollTop}));
 const visible=async(id:string)=>expect.poll(()=>chart.locator(`.gantt-row[data-entity-id="${id}"]`).evaluate(row=>{
  const chart=row.closest('.gantt')!,head=chart.querySelector('.gantt-head')!.getBoundingClientRect(),bounds=chart.getBoundingClientRect(),cells=[...row.children].map(cell=>cell.getBoundingClientRect());
  return cells.every(cell=>cell.top>=head.bottom-1&&cell.bottom<=bounds.bottom+1);
 })).toBe(true);
 await search.fill('Documentation');const before=await snapshot();
 await taskRow(page,'TASK-005').getByRole('button',{name:'TASK-005 Documentation',exact:true}).click();await visible('005');expect(await snapshot()).toEqual(before);
 const position=await chart.evaluate(e=>e.scrollTop);await taskRow(page,'TASK-005').getByRole('button',{name:'TASK-005 Documentation',exact:true}).click();expect(await chart.evaluate(e=>e.scrollTop)).toBe(position);
 await page.locator('.gantt-panel').getByRole('button',{name:'Collapse All',exact:true}).click();await taskRow(page,'TASK-005').getByRole('button',{name:'TASK-005 Documentation',exact:true}).click();await visible('005');expect(await snapshot()).toEqual(before);
 const divider=page.getByRole('separator');await divider.press('ArrowUp');await divider.press('ArrowUp');
 await search.fill('Extra task');await results.evaluate(e=>e.scrollTop=180);const rapidBefore=await snapshot();
 await page.locator('[data-task-id="extra-0"] .analysis-task-link, [data-task-id="extra-44"] .analysis-task-link').evaluateAll(links=>{(links[0] as HTMLElement).click();(links[links.length-1] as HTMLElement).click()});
 await expect(chart.locator('.analysis-selection')).toHaveAttribute('data-entity-id','extra-44');await visible('extra-44');expect(await snapshot()).toEqual(rapidBefore);
 await page.locator('.gantt-panel .shared-search-filter input').fill('no match');
 await page.locator('.gantt-panel').getByRole('button',{name:'Search and filter gantt',exact:true}).click();const filters=page.getByRole('region',{name:'Search and filter controls for gantt',exact:true});await filters.getByRole('checkbox',{name:'Filter Task Status: Completed',exact:true}).check();await filters.getByRole('checkbox',{name:'Hide Unscheduled Tasks',exact:true}).check();await page.keyboard.press('Escape');
 await search.fill('Unscheduled target');const range=page.getByRole('navigation',{name:'Gantt date navigation'}).locator('[data-start]'),dateBefore=await range.getAttribute('data-start'),unscheduledBefore=await snapshot();
 await taskRow(page,'TASK-999').getByRole('button',{name:'TASK-999 Unscheduled target',exact:true}).click();await visible('unscheduled');await expect(range).toHaveAttribute('data-start',dateBefore!);expect(await snapshot()).toEqual(unscheduledBefore);await expect(page.locator('.gantt-panel .shared-search-filter input')).toHaveValue('no match');
});

test('Extended lower tabs support keyboard navigation and preserve divider/default',async({page})=>{
 await open(page);await analysis(page);const tabs=page.getByRole('tablist',{name:'Gantt lower panel'}),tasks=tabs.getByRole('tab',{name:'Tasks',exact:true}),critical=tabs.getByRole('tab',{name:'Critical Path Analysis',exact:true});
 const divider=page.getByRole('separator');await divider.press('ArrowDown');const upper=(await page.locator('.gantt-pane').boundingBox())!.height;
 await critical.focus();await critical.press('ArrowLeft');await expect(tasks).toBeFocused();await expect(tasks).toHaveAttribute('aria-selected','true');await expect(tasks).toHaveCSS('outline-style','solid');
 await tasks.press('End');await expect(critical).toBeFocused();await expect(critical).toHaveAttribute('aria-selected','true');await critical.press('ArrowRight');await expect(tasks).toBeFocused();await tasks.press('Home');await expect(tasks).toBeFocused();
 expect((await page.locator('.gantt-pane').boundingBox())!.height).toBeCloseTo(upper,0);
 await critical.click();await page.getByRole('button',{name:'Simple',exact:true}).click();await page.getByRole('button',{name:'Extended',exact:true}).click();await expect(tasks).toHaveAttribute('aria-selected','true');
});
