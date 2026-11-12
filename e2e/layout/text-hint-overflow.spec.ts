import {test,expect,type Page,type Locator} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeProject,serializeProject} from '../../src/persistence/pmp/codec';
import {captureSchedule} from '../../src/domain/baselines';
const loaded=deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));if(!loaded.ok)throw Error('Invalid fixture');
const base=loaded.value.projectState,tasks=base.tasks.filter(item=>!item.deletion.isDeleted),people=base.people.filter(item=>!item.deletion.isDeleted);
const longName='A very long task name that cannot fit in the available column and must remain accessible in its full tooltip';
const live={...base,tasks:base.tasks.map(item=>item.id===tasks[0].id?{...item,name:'Short',ownerId:people[0].id}:item.id===tasks[1].id?{...item,name:longName,ownerId:people[1].id}:item),people:base.people.map(item=>item.id===people[0].id?{...item,name:'Alex'}:item.id===people[1].id?{...item,name:longName}:item),dependencies:[{id:'hint-short',projectId:base.project.id,predecessor:{kind:'task' as const,id:tasks[0].id},successor:{kind:'task' as const,id:tasks[2].id},type:'Start-to-Start' as const},{id:'hint-long',projectId:base.project.id,predecessor:{kind:'task' as const,id:tasks[1].id},successor:{kind:'task' as const,id:tasks[2].id},type:'Finish-to-Start' as const}]};
const state={...live,baselines:[{id:'hint-plan',name:'Plan',createdAt:'2026-11-09T12:00:00Z',snapshot:captureSchedule(live)}]};
const encoded=serializeProject(state,{createdAt:loaded.value.manifest.createdAt,lastSavedAt:loaded.value.manifest.lastSavedAt,runtimeVersion:'1.7.0'});if(!encoded.ok)throw Error('Invalid hint fixture');const bytes=[...encoded.value];
async function open(page:Page){await page.addInitScript(({bytes})=>{const data=new Uint8Array(bytes);Object.assign(window,{showOpenFilePicker:async()=>[{name:'hints.pmp',getFile:async()=>({name:'hints.pmp',size:data.length,lastModified:1,arrayBuffer:async()=>data.slice().buffer})}]});},{bytes});await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();}
const nav=(page:Page,name:string)=>page.locator('nav').getByRole('button',{name,exact:true}).click();
async function settle(page:Page,anchor:Locator){await anchor.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function noHint(page:Page,anchor:Locator){await settle(page,anchor);await anchor.hover();await expect(anchor).not.toHaveAttribute('title');await page.waitForTimeout(400);await expect(page.locator('.title-tooltip')).toHaveCount(0);await expect(anchor).not.toHaveAttribute('title');await page.mouse.move(0,0);}
async function hint(page:Page,anchor:Locator,text:string){await settle(page,anchor);await anchor.hover();await expect(anchor).not.toHaveAttribute('title');await expect(page.locator('.title-tooltip')).toContainText(text);await page.keyboard.press('Escape');await page.mouse.move(0,0);}
for(const width of [900,1440])test(`text hints appear only for clipped cells, selections and pills at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await open(page);await nav(page,'Dependencies');
 await noHint(page,page.locator('[data-navigation-id="hint-short"] td').nth(2));
 await hint(page,page.locator('[data-navigation-id="hint-long"] td').first(),longName);
 await nav(page,'Baselines');const status=page.locator('.comparison-table tbody tr').first().locator('td').nth(1);if(await status.evaluate(e=>e.scrollWidth>e.clientWidth+1))await hint(page,status,'Matched');else await noHint(page,status);
 const baselineLong=page.locator('.comparison-table tbody tr').filter({hasText:longName}).first().locator('td').first();await hint(page,baselineLong,longName);
 await nav(page,'Tasks');const short=page.locator(`[data-navigation-id="${tasks[0].id}"]`),long=page.locator(`[data-navigation-id="${tasks[1].id}"]`);
 await noHint(page,short.locator('.predictive-select>summary').filter({hasText:'Alex'}));await hint(page,long.locator('.predictive-select>summary').filter({hasText:longName}),longName);
 await nav(page,'Milestones');const pill=page.locator('.scope-pill[aria-label="Project-wide"]').first();const abbreviated=await pill.locator('.scope-pill-short').evaluate(e=>getComputedStyle(e).display!=='none');if(abbreviated)await hint(page,pill,'Project-wide');else await noHint(page,pill);
 await pill.focus();if(abbreviated)await expect(page.locator('.title-tooltip')).toHaveText('Project-wide');else await expect(page.locator('.title-tooltip')).toHaveCount(0);await page.keyboard.press('Escape');
 const duplicate=page.getByRole('button',{name:'Duplicate',exact:true}).first();await settle(page,duplicate);await page.mouse.move(0,0);await duplicate.hover();await expect(page.getByRole('tooltip')).toContainText('Duplicate');
});
test('fitting headings and expanded sidebar labels stay quiet across non-chart pages',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await open(page);
 for(const name of ['Streams','People','Tasks','Milestones','Risk Log','Decision Log','Baselines','Dependencies']){
  await nav(page,name);const heading=page.locator('.workspace table thead th').last();await noHint(page,heading);
 }
 const search=page.locator('nav').getByRole('button',{name:'Search',exact:true});await noHint(page,search);
 await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();await expect(page.locator('.app-shell')).toHaveCSS('grid-template-columns',/64px/);await hint(page,search,'Search');
});
