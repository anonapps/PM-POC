import {test,expect,type Page} from '@playwright/test';
import {serializeProject,deserializeProject} from '../../src/persistence/pmp/codec';
import {regressionFixture} from '../../src/testing/regression-fixture';
import {captureSchedule} from '../../src/domain/baselines';
import {taskFixture} from '../../src/domain/test-fixtures';
import {APP_VERSION} from '../../src/shared/app-info';
const base=regressionFixture();
const source={...base,people:base.people.map((person,index)=>index===base.people.length-1?{...person,name:'regression legacy person'}:person),tasks:[...base.tasks,taskFixture({id:'search-deleted-task',humanId:'TASK-999',name:'Regression archived task',scope:{kind:'project'},deletion:{isDeleted:true,deletedAt:'2026-10-25T00:00:00Z'}})],project:{...base.project,metadata:{...base.project.metadata,gettingStartedCompleted:true}},baselines:[
 {id:'search-baseline-first',name:'Original plan',createdAt:'2026-10-25T00:00:00Z',snapshot:captureSchedule(base)},
 {id:'search-baseline-target',name:'Search checkpoint',description:'Signed commitment',createdAt:'2026-10-26T00:00:00Z',snapshot:captureSchedule(base)},
]};
async function open(page:Page){
 const saved=serializeProject(source,{createdAt:'2026-10-25T00:00:00Z',lastSavedAt:'2026-10-25T00:00:00Z',runtimeVersion:APP_VERSION});if(!saved.ok)throw Error(JSON.stringify(saved.errors));
 await page.addInitScript(({bytes})=>{const data=new Uint8Array(bytes);Object.assign(window,{showOpenFilePicker:async()=>[{name:'search-navigation.pmp',getFile:async()=>({name:'search-navigation.pmp',size:data.length,lastModified:1,arrayBuffer:async()=>data.slice().buffer})}],__searchSaved:()=>[...data]});},{bytes:[...saved.value]});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();await expect(page.locator('nav')).toBeVisible();
}
const nav=async(page:Page,name:string)=>page.locator('nav').getByRole('button',{name,exact:true}).click();
const search=(page:Page)=>page.getByRole('searchbox',{name:'Search names, IDs, roles, notes, status and dates',exact:true});
const title=(page:Page,type:string,id:string)=>page.locator(`.search-result-title[data-search-result-key="${type}:${id}"]`);
const target=(page:Page,id:string)=>page.locator(`[data-navigation-id="${id}"].navigation-target`);
async function revealed(page:Page,id:string){
 const row=target(page,id);await expect(row).toHaveCount(1);await expect(row).toBeInViewport();
 await expect.poll(()=>row.evaluate(node=>node.contains(document.activeElement))).toBe(true);
}

test('all supported Search titles reveal exact records with keyboard navigation and no data changes',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await open(page);
 const person=source.people.filter(e=>!e.deletion.isDeleted).at(-1)!,task=source.tasks.filter(e=>!e.deletion.isDeleted).at(-1)!,stream=source.streams.filter(e=>!e.deletion.isDeleted).at(-1)!,milestone=source.milestones.filter(e=>!e.deletion.isDeleted).at(-1)!,risk=source.risks.filter(e=>!e.deletion.isDeleted).at(-1)!,decision=source.decisions.filter(e=>!e.deletion.isDeleted).at(-1)!,dependency=source.dependencies.at(-1)!;
 const cases=[['Person','People',person.id,person.humanId],['Task','Tasks',task.id,task.humanId],['Stream','Streams',stream.id,stream.humanId],['Milestone','Milestones',milestone.id,milestone.humanId],['Risk','Risk Log',risk.id,risk.humanId],['Decision','Decision Log',decision.id,decision.humanId],['Baseline','Baselines','search-baseline-target','Signed commitment'],['Dependency','Dependencies',dependency.id,dependency.id]];
 for(const [kind,module,id,query] of cases){
  await nav(page,'Search');await search(page).fill(query);const button=title(page,kind,id);await expect(page.getByRole('button',{name:'Open details',exact:true})).toHaveCount(0);
  await expect(button).toHaveCSS('min-height','0px');await expect(button).toHaveCSS('white-space','normal');await button.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(button).toBeFocused();await expect(button).toHaveCSS('outline-style','solid');await button.press('Enter');
  await expect(page.locator('nav').getByRole('button',{name:module,exact:true})).toHaveAttribute('aria-current','page');await revealed(page,id);
  if(kind==='Baseline'){
   await expect(target(page,id).getByRole('button',{name:'Search checkpoint',exact:true})).toHaveAttribute('aria-pressed','false');
   await expect(page.locator('.baseline-selector')).toContainText('Original plan');await page.getByRole('dialog',{name:'Manage baselines'}).getByRole('button',{name:'Done',exact:true}).click();
  }
  if(kind==='Dependency')await expect(target(page,id).getByRole('button',{name:`Edit dependency ${id}`,exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
 }
 const bytes=await page.evaluate(()=>(window as unknown as {__searchSaved:()=>number[]}).__searchSaved()),loaded=deserializeProject(new Uint8Array(bytes));expect(loaded.ok).toBe(true);if(loaded.ok){expect(loaded.value.projectState.tasks).toEqual(source.tasks);expect(loaded.value.projectState.baselines).toEqual(source.baselines);}
});

test('Search return preserves query, type/deleted filters, ordering, focus and scroll; deleted targets are temporary',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await open(page);await nav(page,'Search');await search(page).fill('Regression');
 await page.locator('.filter-trigger').click();await page.getByRole('checkbox',{name:'Filter Entity type: Task',exact:true}).check();await page.getByRole('checkbox',{name:'Include Deleted',exact:true}).check();await page.keyboard.press('Escape');
 const ordered=await page.locator('.search-result-title').evaluateAll(nodes=>nodes.map(node=>(node as HTMLElement).dataset.searchResultKey));expect(ordered.length).toBeGreaterThan(10);expect(await page.locator('.workspace').evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
 const deleted=source.tasks.filter(task=>task.deletion.isDeleted).at(-1)!,button=title(page,'Task',deleted.id);await button.scrollIntoViewIfNeeded();await button.focus();const scroll=await page.locator('.workspace').evaluate(node=>node.scrollTop);expect(scroll).toBeGreaterThan(0);await button.press('Enter');await revealed(page,deleted.id);
 await expect(page.getByRole('checkbox',{name:'Show Deleted',exact:true})).not.toBeChecked();await page.keyboard.press('Escape');await expect(target(page,deleted.id)).toHaveCount(0);await expect(page.locator(`[data-navigation-id="${deleted.id}"]`)).toHaveCount(0);
 await nav(page,'Search');await expect(search(page)).toHaveValue('Regression');await expect(button).toBeFocused();expect(await page.locator('.search-result-title').evaluateAll(nodes=>nodes.map(node=>(node as HTMLElement).dataset.searchResultKey))).toEqual(ordered);
 expect(await page.locator('.workspace').evaluate(node=>node.scrollTop)).toBeCloseTo(scroll,0);
 await page.locator('.filter-trigger').click();await expect(page.getByRole('checkbox',{name:'Filter Entity type: Task',exact:true})).toBeChecked();await expect(page.getByRole('checkbox',{name:'Include Deleted',exact:true})).toBeChecked();await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
});

test('Search temporarily reveals a filtered record and preserves destination preferences while normal navigation still resets',async({page})=>{
 await open(page);const item=source.tasks.find(task=>!task.deletion.isDeleted&&task.status!=='Completed')!;
 await nav(page,'Tasks');await page.getByRole('searchbox',{name:'Search tasks',exact:true}).fill('never-matching-query');await page.locator('.filter-trigger').click();await page.getByRole('checkbox',{name:'Filter Status: Completed',exact:true}).check();await page.keyboard.press('Escape');
 await nav(page,'Search');await search(page).fill(item.humanId);await title(page,'Task',item.id).click();await revealed(page,item.id);
 await expect(page.getByRole('searchbox',{name:'Search tasks',exact:true})).toHaveValue('never-matching-query');await page.locator('.filter-trigger').click();await expect(page.getByRole('checkbox',{name:'Filter Status: Completed',exact:true})).toBeChecked();await page.keyboard.press('Escape');
 await page.keyboard.press('Escape');await expect(page.locator(`[data-navigation-id="${item.id}"]`)).toHaveCount(0);await expect(page.getByRole('searchbox',{name:'Search tasks',exact:true})).toHaveValue('never-matching-query');
 await nav(page,'People');await nav(page,'Tasks');await expect(page.getByRole('searchbox',{name:'Search tasks',exact:true})).toHaveValue('');await page.locator('.filter-trigger').click();await expect(page.getByRole('checkbox',{name:'Filter Status: Completed',exact:true})).not.toBeChecked();
});

test('Warnings reuses exact-record reveal and Search starts fresh for another project session',async({page})=>{
 await open(page);await nav(page,'Search');await search(page).fill('Remember this query');await nav(page,'Warnings');
 const warning=page.locator('.warning-content').filter({hasText:'Task · TASK-'}).first();await expect(warning).toBeVisible();const label=await warning.getAttribute('aria-label');const human=label!.match(/TASK-\d+/)![0],item=source.tasks.find(task=>task.humanId===human)!;
 await warning.click();await revealed(page,item.id);await nav(page,'Search');await expect(search(page)).toHaveValue('Remember this query');
 await nav(page,'File Information');await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.getByRole('button',{name:'Open Project',exact:true}).click();await nav(page,'Search');await expect(search(page)).toHaveValue('');
});
