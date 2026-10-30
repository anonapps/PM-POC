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
async function open(page:Page,partial=false,unavailable=false){
 const saved=serializeProject(fixture(partial),{createdAt:'2026-10-25T00:00:00Z',lastSavedAt:'2026-10-25T00:00:00Z',runtimeVersion:'1.6.0'});if(!saved.ok)throw Error(JSON.stringify(saved.errors));
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
 await nav(page,'Gantt');await expect(toggle).toBeChecked();await expect(page.getByRole('button',{name:'Simple',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Extended',exact:true}).click();await expect(page.getByRole('button',{name:'Tasks',exact:true}).last()).toHaveAttribute('aria-pressed','true');
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
