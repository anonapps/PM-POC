import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeProject,serializeProject} from '../../src/persistence/pmp/codec';
import {captureSchedule} from '../../src/domain/baselines';
const loaded=deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));
if(!loaded.ok)throw new Error('Invalid fixture');
const source=loaded.value;
async function open(page:Page,stateOverride?:typeof source.projectState){
 const baseline={id:'baseline-original',name:'Original plan',description:'Approved schedule',createdAt:'2026-10-26T12:00:00Z',snapshot:captureSchedule(source.projectState)};
 const state=stateOverride??{...source.projectState,baselines:[baseline]};
 const saved=serializeProject(state,{createdAt:source.manifest.createdAt,lastSavedAt:source.manifest.lastSavedAt,runtimeVersion:'1.6.0'});if(!saved.ok)throw new Error(JSON.stringify(saved.errors));
 await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes),modified=Date.now();const handle={name:'v16-disposable.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:modified,arrayBuffer:async()=>data.slice().buffer};},async createWritable(){return{write:async(value:Uint8Array)=>{data=new Uint8Array(value);},close:async()=>{modified=Date.now();}};}};Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>handle,__v16Saved:()=>[...data]});},{bytes:[...saved.value]});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();
}
async function nav(page:Page,name:string){await page.locator('nav').getByRole('button',{name,exact:true}).click();}
async function manage(page:Page){if(await page.getByRole('dialog',{name:'Manage baselines',exact:true}).isVisible())return;await page.locator('.baseline-actions>summary').click();await page.getByRole('button',{name:'Manage baselines',exact:true}).click();}
test('baseline lifecycle, selection, undo, save/reopen and visual controls',async({page},testInfo)=>{
 await page.setViewportSize({width:1440,height:1000});await open(page);await nav(page,'Baselines');await manage(page);
 await expect(page.locator('.baseline-list li')).toHaveCount(1);
 await page.getByRole('button',{name:'Create baseline',exact:true}).click();
 await page.getByRole('dialog').locator('input').fill('Delivery commitment');await page.getByRole('dialog').locator('textarea').fill('Second approved snapshot');await page.getByRole('dialog').getByRole('button',{name:'Create',exact:true}).click();
 await expect(page.locator('.baseline-list li')).toHaveCount(2);
 await page.getByRole('button',{name:'Rename Delivery commitment',exact:true}).click();await page.getByRole('dialog').locator('input').fill('Approved delivery');await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByRole('button',{name:'Approved delivery',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Original plan',exact:true}).click();await expect(page.getByRole('button',{name:'Original plan',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Done',exact:true}).click();await page.screenshot({path:testInfo.outputPath('baseline-comparison.png'),fullPage:true});await manage(page);
 await page.getByRole('button',{name:'Delete Approved delivery',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.baseline-list li')).toHaveCount(2);
 await page.getByRole('button',{name:'Delete Approved delivery',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Delete baseline',exact:true}).click();await expect(page.locator('.baseline-list li')).toHaveCount(1);await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('button',{name:'Undo',exact:true}).click();await manage(page);await expect(page.locator('.baseline-list li')).toHaveCount(2);await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('button',{name:'Save Now',exact:true}).click();await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
 const bytes=await page.evaluate(()=> (window as unknown as {__v16Saved:()=>number[]}).__v16Saved());const reopened=deserializeProject(new Uint8Array(bytes));expect(reopened.ok&&reopened.value.projectState.baselines?.map(b=>b.name)).toEqual(['Original plan','Approved delivery']);
 await nav(page,'Gantt');await page.getByLabel('Baseline overlay',{exact:true}).check();await expect(page.locator('.gantt-baseline').first()).toBeVisible();for(const zoom of ['Month','Quarter','Week']){await page.locator('.gantt-zoom-control select').selectOption(zoom);await expect(page.locator('.gantt-baseline').first()).toBeVisible();}await page.getByLabel('Variance indicators',{exact:true}).check();await expect(page.locator('.variance-indicator').first()).toBeVisible();await page.getByRole('checkbox',{name:'Dependencies',exact:true}).uncheck();await expect(page.locator('.gantt-connectors>path')).toHaveCount(0);await page.screenshot({path:testInfo.outputPath('gantt-baseline.png')});
 await nav(page,'Tube Map');await page.getByLabel('Baseline milestones',{exact:true}).check();await expect(page.getByRole('region',{name:'Baseline milestone indicators'})).toBeVisible();await page.getByRole('checkbox',{name:'Dependencies',exact:true}).uncheck();await expect(page.locator('.tube-connections>path')).toHaveCount(0);await page.screenshot({path:testInfo.outputPath('tube-baseline.png')});
 await nav(page,'File Information');await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.getByRole('button',{name:'Open Project',exact:true}).click();await nav(page,'Baselines');await manage(page);await expect(page.locator('.baseline-list li')).toHaveCount(2);
});
test('dependency filters, editor, invalid self reference, warning recalculation and Undo',async({page},testInfo)=>{
 await page.setViewportSize({width:1280,height:1000});await open(page);await nav(page,'Dependencies');
 const rows=page.locator('.dependency-table tbody tr');expect(await rows.count()).toBeGreaterThan(0);
 await page.locator('.shared-search-filter button').click();await page.getByLabel('Cross-stream only',{exact:true}).check();await page.keyboard.press('Escape');
 await page.locator('.shared-search-filter button').click();await page.getByLabel('Cross-stream only',{exact:true}).uncheck();await page.keyboard.press('Escape');
 await rows.first().getByRole('button',{name:/^Edit dependency /}).click();await expect(page.getByRole('dialog',{name:'Edit dependency'})).toBeVisible();
 const dialog=page.getByRole('dialog',{name:'Edit dependency'}),predecessor=await dialog.locator('summary[aria-label="Dependency predecessor"]').getAttribute('data-value'),successor=await dialog.locator('summary[aria-label="Dependency successor"]').getAttribute('data-value');
 const pickSuccessor=async(value:string)=>{await dialog.locator('summary[aria-label="Dependency successor"]').click();await page.locator('.multi-select-options:popover-open').locator(`input[value="${value}"]`).click();};
 await pickSuccessor(predecessor!);await expect(dialog.getByRole('alert')).toContainText('Self-references');await expect(dialog.getByRole('button',{name:'Save dependency',exact:true})).toBeDisabled();await pickSuccessor(successor!);
 await page.getByLabel('Dependency type',{exact:true}).selectOption('Start-to-Start');await page.getByRole('button',{name:'Save dependency',exact:true}).click();await expect(rows.first()).toContainText('Start-to-Start');
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(rows.first()).not.toContainText('Start-to-Start');await page.screenshot({path:testInfo.outputPath('cross-stream-dependencies.png')});
});

test('comparison preserves and searches historical stream names after rename and soft deletion',async({page})=>{
 const original=source.projectState,task=original.tasks.find(t=>t.scope.kind==='stream')!;
 if(task.scope.kind!=='stream')throw new Error('Fixture requires a stream task');
 const streamId=task.scope.streamId,originalName=original.streams.find(s=>s.id===streamId)!.name;
 const state={...original,streams:original.streams.map(s=>s.id===streamId?{...s,name:'Renamed delivery stream',deletion:{isDeleted:true,deletedAt:'2026-10-26T12:00:00Z'}}:s),tasks:original.tasks.map(t=>t.id===task.id?{...t,deletion:{isDeleted:true,deletedAt:'2026-10-26T12:00:00Z'}}:t),baselines:[{id:'before-rename',name:'Original plan',createdAt:'2026-10-26T12:00:00Z',snapshot:captureSchedule(original)}]};
 await page.setViewportSize({width:1440,height:1000});await open(page,state);await nav(page,'Baselines');
 const search=page.locator('.baselines-panel .shared-search-filter input');await search.fill(originalName);
 const removed=page.locator('.comparison-table tbody tr').filter({hasText:task.humanId});await expect(removed).toHaveCount(1);await expect(removed).toContainText('Removed');await expect(removed.locator('td').nth(2)).toHaveText(originalName);
 await search.fill('Renamed delivery stream');await expect(removed).toHaveCount(0);expect(await page.locator('.comparison-table tbody tr').count()).toBeGreaterThan(0);
 const streams=page.locator('.comparison-table tbody tr').first().locator('td').nth(2);await expect(streams.locator('span').nth(0)).toContainText(originalName);await expect(streams.locator('span').nth(0)).not.toContainText('Renamed delivery stream');await expect(streams.locator('span').nth(1)).toContainText('Renamed delivery stream');
});

for(const width of [900,1024,1440,1920])test(`approved Baselines continuous comparison layout at ${width}`,async({page},testInfo)=>{
 const original=source.projectState,dated=original.tasks.find(t=>!t.deletion.isDeleted&&t.startDate&&t.endDate)!;
 const finish=new Date(`${dated.endDate}T00:00:00Z`);finish.setUTCDate(finish.getUTCDate()+3);
 const baseline={id:'approved-layout',name:'Original plan',description:'Approved schedule',createdAt:'2026-10-26T12:00:00Z',snapshot:captureSchedule(original)};
 const state={...original,tasks:original.tasks.map(t=>t.id===dated.id?{...t,endDate:finish.toISOString().slice(0,10)}:t),baselines:[baseline,{...baseline,id:'delivery-layout',name:'Approved delivery',description:undefined}]};
 await page.setViewportSize({width,height:1000});await open(page,state);await nav(page,'Baselines');
 const panel=page.locator('.baselines-panel'),table=panel.locator('.comparison-table');
 await expect(table).toHaveCSS('display','table');await expect(table.locator('th')).toHaveCount(9);
 const toolbar=await panel.locator('.page-toolbar').evaluate(e=>{const r=e.getBoundingClientRect(),search=e.querySelector('.shared-search-filter')!.getBoundingClientRect();return {centers:[...e.children].map(child=>{const b=child.getBoundingClientRect();return b.y+b.height/2;}),center:r.x+r.width/2,search:search.x+search.width/2};});expect(Math.max(...toolbar.centers)-Math.min(...toolbar.centers)).toBeLessThan(2);expect(toolbar.search).toBeCloseTo(toolbar.center,0);
 const headers=await table.locator('th').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,height:r.height,overflow:e.scrollWidth-e.clientWidth,background:getComputedStyle(e).backgroundColor};}));
 for(const [index,header] of headers.entries()){expect(header.y).toBe(headers[0].y);expect(header.height).toBe(headers[0].height);expect(header.background).toBe(headers[0].background);expect(header.overflow).toBeLessThanOrEqual(1);if(index)expect(header.x).toBeCloseTo(headers[index-1].right,0);}
 const rows=await table.locator('tbody tr').evaluateAll(nodes=>nodes.map(row=>{const r=row.getBoundingClientRect();return {height:r.height,cells:[...row.children].map(cell=>{const b=cell.getBoundingClientRect();return {x:b.x,right:b.right,y:b.y,height:b.height,whiteSpace:getComputedStyle(cell).whiteSpace,label:getComputedStyle(cell,'::before').content};})};}));
 for(const row of rows){expect(row.height).toBeLessThanOrEqual(50);for(const [index,cell] of row.cells.entries()){expect(cell.y).toBe(row.cells[0].y);expect(cell.height).toBe(row.cells[0].height);expect(cell.x).toBeCloseTo(headers[index].x,0);expect(cell.right).toBeCloseTo(headers[index].right,0);expect(cell.whiteSpace).toBe('nowrap');expect(['none','normal']).toContain(cell.label);}}
 const entity=table.locator('tbody tr').first().locator('td').first();await expect(entity).toHaveAttribute('title',new RegExp(original.tasks[0].humanId));await expect(entity.locator('.comparison-entity')).toContainText(original.tasks[0].name);
 const changed=table.locator('tbody tr').filter({hasText:dated.humanId});await expect(changed.locator('td').last()).toHaveText('+3d');await expect(changed.locator('td').last()).toHaveAttribute('data-variance','later');
 await manage(page);const actions=await page.locator('.baseline-list li').evaluateAll(items=>items.map(item=>[...item.querySelectorAll('button')].slice(-2).map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y+r.height/2};})));
 expect(actions[0][0].x).toBe(actions[1][0].x);expect(actions[0][1].x).toBe(actions[1][1].x);for(const pair of actions)expect(pair[0].y).toBe(pair[1].y);await page.getByRole('button',{name:'Done',exact:true}).click();
 expect(await panel.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);expect(await page.locator('.workspace').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
 await page.screenshot({path:testInfo.outputPath(`${width}-baselines-aligned.png`)});
 const search=panel.locator('.shared-search-filter input');await search.fill(dated.humanId);await expect(table.locator('tbody tr')).toHaveCount(1);await expect(changed.locator('td').last()).toHaveText('+3d');
});
