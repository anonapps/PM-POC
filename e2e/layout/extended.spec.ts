import {test,expect,type Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
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
for(const {width,height} of [{width:1024,height:1000},{width:1440,height:1000},{width:1920,height:1000},{width:1366,height:768}])test(`Extended Add Task exactly matches standalone Tasks at ${width}x${height}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height});await openProject(page);await navigate(page,'Tasks');
 const originalCenter=await searchCenter(page,'.shared-search-filter');
 await page.getByRole('button',{name:'Add Task',exact:true}).click();await expect(page.getByRole('dialog',{name:'Create Task',exact:true})).toBeVisible();
 const standalone=await panelMetrics(page);
 // Legacy optional 560px/two-column work snapshots predate the approved reflow.
 // The complete live standalone metrics remain the exact Extended reference.
 const assertFits=async()=>{
  const fit=await page.getByRole('dialog',{name:'Create Task',exact:true}).evaluate(panel=>{
   const fields=panel.querySelector('.creation-fields')!,footer=panel.querySelector('.creation-footer')!.getBoundingClientRect();
   return {verticalOverflow:fields.scrollHeight-fields.clientHeight,horizontalOverflow:fields.scrollWidth-fields.clientWidth,footerTop:footer.top,footerBottom:footer.bottom};
  });
  expect(fit.verticalOverflow).toBeLessThanOrEqual(1);expect(fit.horizontalOverflow).toBeLessThanOrEqual(1);
  expect(fit.footerTop).toBeGreaterThanOrEqual(0);expect(fit.footerBottom).toBeLessThanOrEqual(height);
 };
 await assertFits();
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
 const groups=[['Owner','Status','Priority'],['Start date','End date','Scope'],['Parent task','Milestone','Progress']] as const;
 const box=async(label:string)=>panel.locator('input,select,summary').filter({visible:true}).evaluateAll((controls,name)=>{const control=controls.find(e=>e.getAttribute('aria-label')===name||e.textContent?.startsWith(`${name} ·`));if(!control)throw new Error(`Missing ${name}`);const r=control.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};},label);
 let previousRow=-Infinity;
 for(const group of groups){
  const row=await Promise.all(group.map(box));expect(row[0].y).toBeGreaterThan(previousRow);previousRow=row[0].y;
  for(const [index,control] of row.entries()){expect(control.y).toBeCloseTo(row[0].y,1);expect(control.height).toBe(34);expect(control.width).toBeCloseTo(row[0].width,1);if(index)expect(control.x).toBeGreaterThan(row[index-1].x+row[index-1].width);}
 }
 const predecessor=await box('Predecessor tasks'),owner=await box('Owner');
 expect(predecessor.y).toBeGreaterThan(previousRow);expect(predecessor.height).toBe(34);expect(predecessor.width).toBeCloseTo(owner.width,1);expect(predecessor.x).toBeCloseTo(owner.x,1);
 await assertFits();

 expect(actual.panel).toMatchObject({x:width-880,y:0,width:880,height});expect(actual.backdrop).toEqual({x:0,y:0,width,height});
 await expect(panel.getByLabel('Task name',{exact:true})).toBeFocused();
 await page.screenshot({path:testInfo.outputPath(`${width}-extended-add-task.png`)});
 writeFileSync(testInfo.outputPath('panel-equivalence.json'),JSON.stringify({width,height,standalone,extended:actual},null,2));
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
 await gantt.getByLabel('Baseline overlay',{exact:true}).check();await gantt.getByLabel('Variance indicators',{exact:true}).check();await expect(gantt.locator('.variance-indicator').first()).toBeVisible();await gantt.getByRole('checkbox',{name:'Dependencies',exact:true}).uncheck();await expect(gantt.locator('.gantt-connectors .dependency-line')).toHaveCount(0);
 await page.getByRole('button',{name:'Save Now',exact:true}).click();await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();const bytes=await page.evaluate(()=>(window as unknown as {__extendedBytes:()=>number[]}).__extendedBytes());const saved=deserializeProject(new Uint8Array(bytes));expect(saved.ok).toBe(true);if(!saved.ok)throw new Error('Invalid saved project');expect(saved.value.projectState.tasks.some(t=>t.name==='Extended quick edit'&&!t.deletion.isDeleted)).toBe(true);expect(saved.value.projectState.baselines![0].snapshot).toEqual(captureSchedule(fixture.projectState));expect(saved.value.projectState.auditHistory!.events.length).toBeGreaterThan(3);
 await page.screenshot({path:testInfo.outputPath('extended-baselines-and-edits.png')});await navigate(page,'File Information');await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.getByRole('button',{name:'Open Project',exact:true}).click();await navigate(page,'Gantt');await expect(page.getByRole('group',{name:'Gantt mode'}).getByRole('button',{name:'Simple',exact:true})).toHaveAttribute('aria-pressed','true');await extended(page);await expect(page.locator('.gantt-tasks-pane input[value="Extended quick edit"]')).toBeVisible();
});

test('approved alignment preserves navigation, project header and standalone Tasks across modes',async({page},testInfo)=>{
 await page.setViewportSize({width:1440,height:1000});await openProject(page);
 const nav=page.getByRole('navigation',{name:'Project modules'});
 const names=['Overview','Search','Streams','People','Tasks','Gantt','Milestones','Tube Map','Risk Log','Decision Log','Baselines','Dependencies','Warnings','File Information'];
 const navigation=()=>nav.getByRole('button').evaluateAll(buttons=>buttons.map(button=>({name:button.getAttribute('aria-label'),icon:button.querySelector('.module-letter')?.innerHTML})));
 const originalNavigation=await navigation();expect(originalNavigation.map(item=>item.name)).toEqual(names);
 const header=()=>page.locator('.app-main>header').evaluate(element=>({text:element.textContent,html:element.innerHTML,rect:element.getBoundingClientRect().toJSON()}));
 const originalHeader=await header();
 await navigate(page,'Tasks');await expect(page.getByRole('heading',{name:'Tasks',exact:true})).toBeVisible();
 const taskSurface=()=>page.locator('.workspace>.panel').evaluate(element=>({
  rect:element.getBoundingClientRect().toJSON(),font:getComputedStyle(element).font,
  controls:[...element.querySelectorAll<HTMLElement>('h1,th,input,select,summary,button')].filter(control=>control.checkVisibility()).map(control=>({
   label:control.getAttribute('aria-label')??control.textContent,value:'value' in control?control.value:null,
   disabled:'disabled' in control?control.disabled:null,rect:control.getBoundingClientRect().toJSON(),
   font:getComputedStyle(control).font,padding:getComputedStyle(control).padding,
  })),
 }));
 const standalone=await taskSurface();
 await navigate(page,'Gantt');await extended(page);
 await expect(page.getByRole('heading',{name:'Gantt',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Tasks',exact:true})).toBeVisible();
 expect(await navigation()).toEqual(originalNavigation);expect(await header()).toEqual(originalHeader);
 const positions=()=>nav.getByRole('button').evaluateAll(buttons=>buttons.map(button=>button.getBoundingClientRect().y));
 const expandedPositions=await positions();
 await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
 expect(await navigation()).toEqual(originalNavigation);expect(await positions()).toEqual(expandedPositions);
 const content=await page.locator('.gantt-panel').boundingBox();
 for(const selector of ['.gantt-panel>.page-toolbar>.shared-search-filter','.gantt-tasks-pane .shared-search-filter'])expect(await searchCenter(page,selector)).toBeCloseTo(content!.x+content!.width/2,0);
 await page.screenshot({path:testInfo.outputPath('alignment-collapsed-sidebar.png')});
 await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();expect(await header()).toEqual(originalHeader);
 await page.screenshot({path:testInfo.outputPath('alignment-extended-shell.png')});
 await page.getByRole('group',{name:'Gantt mode'}).getByRole('button',{name:'Simple',exact:true}).click();
 expect(await navigation()).toEqual(originalNavigation);expect(await header()).toEqual(originalHeader);
 await navigate(page,'Tasks');
 // Compare visible fields, values, actions and geometry; generated radio-group IDs change on remount.
 expect(await taskSurface()).toEqual(standalone);
 await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
 await page.screenshot({path:testInfo.outputPath('alignment-standalone-tasks.png')});
});

for(const width of [900,1024,1440,1920])test(`Extended Tasks continuous single-row table at ${width}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:1000});await openProject(page);await navigate(page,'Tasks');
 const headerStyle=await page.locator('.tasks-table th').first().evaluate(e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
 await navigate(page,'Gantt');await extended(page);
 const pane=page.locator('.gantt-tasks-pane'),table=pane.locator('.tasks-table');
 await expect(table).toHaveCSS('display','table');
 const headings=await table.locator('th').evaluateAll(cells=>cells.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,right:r.right,y:r.y,height:r.height,background:s.backgroundColor,color:s.color};}));
 for(const [index,heading] of headings.entries()){
  expect({background:heading.background,color:heading.color}).toEqual(headerStyle);
  expect(heading.y).toBeCloseTo(headings[0].y,0);expect(heading.height).toBe(headings[0].height);
  if(index)expect(heading.x).toBeCloseTo(headings[index-1].right,0);
 }
 const row=table.locator('tbody tr').first();
 const cells=await row.locator('td').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,height:r.height,label:getComputedStyle(e,'::before').content};}));
 for(const [index,cell] of cells.entries()){expect(cell.y).toBeCloseTo(cells[0].y,0);expect(cell.height).toBe(cells[0].height);expect(['none','normal']).toContain(cell.label);expect(cell.x).toBeCloseTo(headings[index].x,0);expect(cell.right).toBeCloseTo(headings[index].right,0);}
 const controls=await row.locator(':scope>td>input,:scope>td>select,:scope>td>details>summary,:scope>td>.task-progress-field>input,:scope>td.table-actions>button').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect(),cell=e.closest('td')!.getBoundingClientRect();return {label:e.getAttribute('aria-label')??e.textContent,rect:r.toJSON(),cell:cell.toJSON(),center:r.y+r.height/2,inside:r.left>=cell.left-1&&r.right<=cell.right+1&&r.top>=cell.top-1&&r.bottom<=cell.bottom+1};}));
 expect(controls.length).toBeGreaterThanOrEqual(10);expect(controls.filter(c=>!c.inside)).toEqual([]);expect(Math.max(...controls.map(c=>c.center))-Math.min(...controls.map(c=>c.center))).toBeLessThan(2);
 expect(await pane.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
 await page.screenshot({path:testInfo.outputPath(`${width}-extended-tasks-aligned.png`)});
 const date=row.getByLabel('Start Date for TASK-001',{exact:true}),before=await date.boundingBox();
 await date.fill('2030-01-02');await row.getByLabel('End Date for TASK-001',{exact:true}).fill('2030-01-01');
 await expect(row.getByRole('alert')).toContainText('End Date must be on or after Start Date.');
 expect(await date.boundingBox()).toEqual(before);

});

for(const width of [900,1024,1280,1440,1920])test(`Gantt and embedded Tasks toolbars preserve standard centered Search at ${width}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:1000});await openProject(page);await navigate(page,'Gantt');
 const check=async(selector:string)=>{
  const toolbar=page.locator(selector);
  const geometry=await toolbar.evaluate(e=>{
   const r=e.getBoundingClientRect(),search=e.querySelector('.shared-search-filter')!.getBoundingClientRect();
   const controls=[...e.querySelectorAll('h1,input[type=search],button,select,.toggle')].map(control=>{const b=control.getBoundingClientRect();return {label:control.getAttribute('aria-label')??control.textContent,action:Boolean(control.closest('.actions,.header-actions')),search:Boolean(control.closest('.shared-search-filter')),center:b.y+b.height/2,left:b.left,right:b.right};});
   const regions=[...e.children].map(child=>{const b=child.getBoundingClientRect();return {left:b.left,right:b.right};});
   return {rect:r.toJSON(),searchCenter:search.x+search.width/2,searchRight:search.right,searchWidth:search.width,searchTop:search.top,controls,regions,overflow:e.scrollWidth-e.clientWidth};
  });
  const band=geometry.controls.filter(c=>c.action);expect(Math.max(...band.map(c=>c.center))-Math.min(...band.map(c=>c.center))).toBeLessThan(2);expect(geometry.searchWidth).toBe(340);
  for(const control of geometry.controls){expect(control.left).toBeGreaterThanOrEqual(geometry.rect.left-1);expect(control.right).toBeLessThanOrEqual(geometry.rect.right+1);if(control.action&&Math.abs(control.center-(geometry.searchTop+17))<2)expect(control.left).toBeGreaterThanOrEqual(geometry.searchRight+1);}
  if(Math.abs(band[0].center-(geometry.searchTop+17))<2){expect(geometry.regions[0].right).toBeLessThanOrEqual(geometry.regions[1].left);expect(geometry.regions[1].right).toBeLessThanOrEqual(geometry.regions[2].left);}else expect(Math.abs(geometry.searchTop+17-band[0].center)).toBeGreaterThan(20);
  expect(geometry.searchCenter).toBeCloseTo(geometry.rect.x+geometry.rect.width/2,0);expect(geometry.overflow).toBeLessThanOrEqual(1);
 };
 for(const collapsed of [false,true]){
  if(collapsed)await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
  await check('.gantt-panel>.page-toolbar');await extended(page);await check('.gantt-panel>.page-toolbar');await check('.gantt-tasks-pane .page-toolbar');
  await page.screenshot({path:testInfo.outputPath(`${width}-${collapsed?'collapsed':'expanded'}-single-line-toolbars.png`)});
  await page.getByRole('group',{name:'Gantt mode'}).getByRole('button',{name:'Simple',exact:true}).click();
 }
});
