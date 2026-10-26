import {test,expect,type Page} from '@playwright/test';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {deserializeProject,serializeProject} from '../../src/persistence/pmp/codec';
import {captureSchedule} from '../../src/domain/baselines';
const decoded=deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));
if(!decoded.ok)throw new Error('Invalid rich fixture');
const fixture=decoded.value;
async function openProject(page:Page){
 const source=fixture.projectState;
 const state={...source,auditHistory:{enabled:true,events:[]},baselines:[{id:'approved-baseline',name:'Approved plan',createdAt:'2026-10-26T12:00:00Z',snapshot:captureSchedule(source)}]};
 const saved=serializeProject(state,{createdAt:fixture.manifest.createdAt,lastSavedAt:fixture.manifest.lastSavedAt,runtimeVersion:'1.6.0'});if(!saved.ok)throw new Error(JSON.stringify(saved.errors));
 await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes),modified=Date.now();const handle={name:'extended-disposable.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:modified,arrayBuffer:async()=>data.slice().buffer};},async createWritable(){let pending=data;return{write:async(value:Uint8Array)=>{pending=new Uint8Array(value).slice();},close:async()=>{data=pending;modified++;}};}};Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>handle,__extendedBytes:()=>[...data]});},{bytes:[...saved.value]});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();
}
async function navigate(page:Page,name:string){await page.getByRole('navigation',{name:'Project modules'}).getByRole('button',{name,exact:true}).click();}
async function panelMetrics(page:Page){return page.getByRole('dialog',{name:'Create Task',exact:true}).evaluate(panel=>{
 const rect=(e:Element)=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
 const style=(e:Element)=>{const s=getComputedStyle(e);return {font:s.font,fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,padding:s.padding,margin:s.margin,gap:s.gap,display:s.display};};
 return {panel:{...rect(panel),...style(panel)},backdrop:rect(panel.parentElement!),fields:[...panel.querySelectorAll('.creation-field,.creation-selector,.creation-relationship,.creation-footer,.creation-fields,header')].map(e=>({label:e.querySelector('span')?.textContent??e.firstChild?.textContent,rect:rect(e),style:style(e)})),controls:[...panel.querySelectorAll('input,textarea,select,summary,button')].map(e=>({label:e.getAttribute('aria-label')??e.textContent,rect:rect(e),style:style(e)}))};
 });}
async function extended(page:Page){await page.getByRole('group',{name:'Gantt mode'}).getByRole('button',{name:'Extended',exact:true}).click();await expect(page.locator('.gantt-tasks-pane')).toBeVisible();}
async function searchCenter(page:Page,selector:string){const r=await page.locator(selector).boundingBox();return r!.x+r!.width/2;}
for(const width of [1024,1440,1920])test(`Extended Add Task exactly matches standalone Tasks at ${width}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:1000});await openProject(page);await navigate(page,'Tasks');
 const originalCenter=await searchCenter(page,'.shared-search-filter');
 await page.getByRole('button',{name:'Add Task',exact:true}).click();await expect(page.getByRole('dialog',{name:'Create Task',exact:true})).toBeVisible();
 const standalone=await panelMetrics(page);
 if(existsSync(`work/tasks-panel-reference-${width}.json`))expect(standalone).toEqual(JSON.parse(readFileSync(`work/tasks-panel-reference-${width}.json`,'utf8')));
 await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await navigate(page,'Gantt');
 const mode=page.getByRole('group',{name:'Gantt mode'});await expect(mode.getByRole('button',{name:'Simple',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(await mode.evaluate(e=>e.nextElementSibling?.textContent)).toBe('Expand All');
 expect(await searchCenter(page,'.gantt-panel>.page-toolbar>.shared-search-filter')).toBeCloseTo(originalCenter,1);
 await extended(page);
 await expect(mode.getByRole('button',{name:'Extended',exact:true})).toHaveCSS('background-color','rgb(36, 89, 169)');
 expect(await searchCenter(page,'.gantt-panel>.page-toolbar>.shared-search-filter')).toBeCloseTo(originalCenter,1);
 expect(await searchCenter(page,'.gantt-tasks-pane .shared-search-filter')).toBeCloseTo(originalCenter,1);
 const ganttSearch=page.locator('.gantt-panel .shared-search-filter input'),taskSearch=page.locator('.gantt-tasks-pane .shared-search-filter input');
 await ganttSearch.fill('Regression');await taskSearch.fill('TASK-001');
 await mode.getByRole('button',{name:'Simple',exact:true}).click();await expect(page.locator('.gantt-tasks-pane')).toBeHidden();await extended(page);await expect(ganttSearch).toHaveValue('Regression');await expect(taskSearch).toHaveValue('TASK-001');await ganttSearch.fill('');await taskSearch.fill('');
 await page.locator('.gantt-tasks-pane').getByRole('button',{name:'Add Task',exact:true}).click();const panel=page.getByRole('dialog',{name:'Create Task',exact:true});await expect(panel).toBeVisible();
 const actual=await panelMetrics(page);expect(actual).toEqual(standalone);
 expect(actual.panel).toMatchObject({x:width-560,y:0,width:560,height:1000});expect(actual.backdrop).toEqual({x:0,y:0,width,height:1000});
 await expect(panel.getByLabel('Task name',{exact:true})).toBeFocused();
 await page.screenshot({path:testInfo.outputPath(`${width}-extended-add-task.png`)});
 writeFileSync(testInfo.outputPath('panel-equivalence.json'),JSON.stringify({width,standalone,extended:actual},null,2));
 await panel.getByLabel('Task name',{exact:true}).fill('Unsaved shared draft');await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Discard unsaved changes?',exact:true})).toBeVisible();await page.getByRole('dialog',{name:'Discard unsaved changes?',exact:true}).getByRole('button',{name:'Stay',exact:true}).click();await expect(panel.getByLabel('Task name',{exact:true})).toHaveValue('Unsaved shared draft');await panel.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.screenshot({path:testInfo.outputPath(`${width}-extended-layout.png`)});
});
for(const width of [1024,1440,1920])test(`Extended resizing, independent scroll and unchanged colors at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await openProject(page);await navigate(page,'Gantt');
 const palette={'Tentative':'#9d8ab8','Not Started':'#a0adbd','In Progress':'#6b97c4','On Hold':'#c4a36c','Completed':'#7ca58a','Cancelled':'#bb8585'};
 const colors=async()=>page.locator('.gantt-panel .timeline-status-legend [role=listitem]').evaluateAll(nodes=>Object.fromEntries(nodes.map(e=>[e.textContent!.trim(),getComputedStyle(e.querySelector('i')!).backgroundColor])));
 const rgb=(hex:string)=>`rgb(${[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(', ')})`;
 const simpleColors=await colors();expect(simpleColors).toEqual(Object.fromEntries(Object.entries(palette).map(([key,value])=>[key,rgb(value)])));
 const simpleHeight=(await page.locator('.gantt-row>div').first().boundingBox())!.height;
 await extended(page);expect(await colors()).toEqual(simpleColors);expect((await page.locator('.gantt-row>div').first().boundingBox())!.height).toBeLessThan(simpleHeight);
 const chart=page.locator('.gantt-panel .gantt'),lower=page.locator('.gantt-tasks-pane');
 await lower.evaluate(e=>e.scrollTop=300);expect(await chart.evaluate(e=>e.scrollTop)).toBe(0);const lowerScroll=await lower.evaluate(e=>e.scrollTop);expect(lowerScroll).toBeGreaterThan(0);
 await chart.evaluate(e=>e.scrollTop=200);expect(await lower.evaluate(e=>e.scrollTop)).toBe(lowerScroll);
 const footer=(await page.getByRole('navigation',{name:'Gantt date navigation'}).boundingBox())!,upper=(await page.locator('.gantt-pane').boundingBox())!;expect(footer.y+footer.height).toBeLessThanOrEqual(upper.y+upper.height+1);
 const lowerRect=(await lower.boundingBox())!,toolbar=(await lower.locator('.page-toolbar').boundingBox())!;expect(toolbar.y).toBeCloseTo(lowerRect.y,0);
 const separator=page.getByRole('separator',{name:'Resize Gantt and Tasks panes'});await separator.focus();const before=(await page.locator('.gantt-pane').boundingBox())!.height;await page.keyboard.press('ArrowDown');await expect.poll(async()=>(await page.locator('.gantt-pane').boundingBox())!.height).toBeCloseTo(before+16,0);await page.keyboard.press('Shift+ArrowUp');await expect.poll(async()=>(await page.locator('.gantt-pane').boundingBox())!.height).toBeCloseTo(before-48,0);
 const handle=(await separator.boundingBox())!;await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2+50,{steps:4});await page.mouse.up();expect((await lower.boundingBox())!.height).toBeGreaterThanOrEqual(200);
 await page.setViewportSize({width:900,height:760});expect(await page.locator('.workspace').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);expect(await lower.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);expect(await chart.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
});
test('Extended edits, creation, quick edits, history, baselines and PMP reopen share canonical data',async({page},testInfo)=>{
 await page.setViewportSize({width:1440,height:1000});await page.clock.setFixedTime(new Date('2026-10-26T12:00:00Z'));await openProject(page);await navigate(page,'Gantt');await extended(page);
 const lower=page.locator('.gantt-tasks-pane'),gantt=page.locator('.gantt-panel');
 const name=lower.getByLabel('Name for TASK-001',{exact:true}),original=await name.inputValue();await name.fill('Extended shared task');await name.press('Tab');await expect(gantt.getByRole('button',{name:'Extended shared task',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(name).toHaveValue(original);await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(name).toHaveValue('Extended shared task');
 await lower.getByRole('button',{name:'Add Task',exact:true}).click();const panel=page.getByRole('dialog',{name:'Create Task',exact:true});await panel.getByLabel('Task name',{exact:true}).fill('Extended created task');await panel.getByLabel('Start date',{exact:true}).fill('2026-10-26');await panel.getByLabel('End date',{exact:true}).fill('2026-10-29');await panel.getByRole('button',{name:'Create',exact:true}).click();await expect(panel).toHaveCount(0);
 await gantt.getByRole('button',{name:'Extended created task',exact:true}).click();const quick=page.getByRole('form',{name:'Quick edit task'});await quick.getByLabel('Task name',{exact:true}).fill('Extended quick edit');await quick.getByRole('button',{name:'Save',exact:true}).click();const newRow=lower.locator('tbody tr').filter({has:page.locator('input[value="Extended quick edit"]')});await expect(newRow).toBeVisible();
 await newRow.getByRole('button',{name:'Delete',exact:true}).click();await expect(gantt.getByRole('button',{name:'Extended quick edit',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(gantt.getByRole('button',{name:'Extended quick edit',exact:true})).toBeVisible();
 await gantt.getByLabel('Baseline overlay',{exact:true}).check();await gantt.getByLabel('Variance indicators',{exact:true}).check();await expect(gantt.locator('.variance-indicator').first()).toBeVisible();await gantt.getByRole('checkbox',{name:'Dependencies',exact:true}).uncheck();await expect(gantt.locator('.gantt-connectors>path')).toHaveCount(0);
 await page.getByRole('button',{name:'Save Now',exact:true}).click();await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();const bytes=await page.evaluate(()=>(window as unknown as {__extendedBytes:()=>number[]}).__extendedBytes());const saved=deserializeProject(new Uint8Array(bytes));expect(saved.ok).toBe(true);if(!saved.ok)throw new Error('Invalid saved project');expect(saved.value.projectState.tasks.some(t=>t.name==='Extended quick edit'&&!t.deletion.isDeleted)).toBe(true);expect(saved.value.projectState.baselines![0].snapshot).toEqual(captureSchedule(fixture.projectState));expect(saved.value.projectState.auditHistory!.events.length).toBeGreaterThan(3);
 await page.screenshot({path:testInfo.outputPath('extended-baselines-and-edits.png')});await navigate(page,'File Information');await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.getByRole('button',{name:'Open Project',exact:true}).click();await navigate(page,'Gantt');await expect(page.getByRole('group',{name:'Gantt mode'}).getByRole('button',{name:'Simple',exact:true})).toHaveAttribute('aria-pressed','true');await extended(page);await expect(page.locator('.gantt-tasks-pane input[value="Extended quick edit"]')).toBeVisible();
});
