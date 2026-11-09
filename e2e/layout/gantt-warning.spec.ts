import {test,expect,type Page} from '@playwright/test';
import {makeProjectState,taskFixture} from '../../src/domain/test-fixtures';
import {serializeProject} from '../../src/persistence/pmp/codec';
import {APP_VERSION} from '../../src/shared/app-info';

const source=makeProjectState({tasks:[taskFixture({id:'late',humanId:'TASK-001',name:'Source task',scope:{kind:'project'},startDate:'2026-11-01',endDate:'2026-11-15'}),taskFixture({id:'undated',humanId:'TASK-002',name:'Undated task',scope:{kind:'project'},startDate:null,endDate:null})],milestones:[{id:'warned',projectId:'project-1',humanId:'MILESTONE-001',name:'Warned gate',plannedDate:'2026-11-09',status:'Planned',ownerId:null,scope:{kind:'project'},relatedTaskIds:[],deletion:{isDeleted:false}},{id:'clear',projectId:'project-1',humanId:'MILESTONE-002',name:'Clear gate',plannedDate:'2026-11-09',status:'Planned',ownerId:null,scope:{kind:'project'},relatedTaskIds:[],deletion:{isDeleted:false}}],dependencies:[{id:'late-link',projectId:'project-1',predecessor:{kind:'task',id:'late'},successor:{kind:'milestone',id:'warned'},type:'Finish-to-Start'},{id:'undated-link',projectId:'project-1',predecessor:{kind:'task',id:'undated'},successor:{kind:'milestone',id:'warned'},type:'Finish-to-Start'}]});
const saved=serializeProject(source,{createdAt:'2026-11-09T12:00:00Z',lastSavedAt:'2026-11-09T12:00:00Z',runtimeVersion:APP_VERSION});
if(!saved.ok)throw new Error(JSON.stringify(saved.errors));
const bytes=[...saved.value];
async function open(page:Page){
 await page.clock.setFixedTime(new Date('2026-11-09T12:00:00Z'));
 await page.addInitScript(({bytes})=>{const data=new Uint8Array(bytes),handle={name:'warning-layout.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:1,arrayBuffer:async()=>data.slice().buffer}}};Object.assign(window,{showOpenFilePicker:async()=>[handle]})},{bytes});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();await page.locator('nav').getByRole('button',{name:'Gantt',exact:true}).click();
}
for(const width of [900,1440])test(`Gantt warning precedes the unchanged name and preserves disclosure/actions at ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await open(page);
 const row=page.locator('.gantt-row[data-entity-id="warned:project"]'),title=row.getByRole('button',{name:'Warned gate',exact:true}),warning=row.locator('.gantt-warning summary');
 for(const mode of ['Simple','Extended']){
  await page.getByRole('button',{name:mode,exact:true}).click();await row.scrollIntoViewIfNeeded();
  const geometry=await title.evaluate(e=>{const box=e.getBoundingClientRect(),cell=e.closest('.gantt-row')!.firstElementChild!,r=cell.getBoundingClientRect(),s=getComputedStyle(cell);return{box:box.toJSON(),cell:r.toJSON(),paddingLeft:parseFloat(s.paddingLeft),paddingRight:parseFloat(s.paddingRight),borders:parseFloat(s.borderLeftWidth)+parseFloat(s.borderRightWidth),font:getComputedStyle(e).font,offsetY:box.y-r.y}});
  const icon=(await warning.boundingBox())!;
  expect(geometry.box.x).toBeCloseTo(geometry.cell.x+geometry.paddingLeft,1);
  expect(geometry.box.width).toBeCloseTo(geometry.cell.width-geometry.paddingLeft-geometry.paddingRight-geometry.borders,0);
  expect(geometry.offsetY).toBe(mode==='Simple'?5:4);
  expect(geometry.font).toBe('14px / 20.3px Arial, Helvetica, sans-serif');
  expect(icon.x).toBeGreaterThanOrEqual(geometry.cell.x);expect(geometry.box.x-icon.x-icon.width).toBeCloseTo(3,1);expect(icon.y+icon.height/2).toBeCloseTo(geometry.box.y+geometry.box.height/2,1);
  await expect(warning).toHaveText('⚠');await expect(warning).toHaveAttribute('aria-description','2 dependency warnings');await expect(warning).toHaveAttribute('title','2 dependency warnings');
  const rect=()=>title.evaluate(e=>e.getBoundingClientRect().toJSON());const before=await rect();
  await warning.evaluate(e=>(e as HTMLElement).style.visibility='hidden');expect(await rect()).toEqual(before);await warning.evaluate(e=>(e as HTMLElement).style.visibility='');
  await warning.focus();await page.keyboard.press('Enter');const popup=row.locator('.anchored-options:popover-open');await expect(popup).toBeVisible();await expect(popup.locator('li')).toHaveCount(2);await expect(popup).toContainText('Scheduling conflict');await expect(popup).toContainText('Dependency not scheduled');expect(await rect()).toEqual(before);
  if(width===1440)await page.screenshot({path:info.outputPath(`warning-${mode.toLowerCase()}-open.png`)});
  await page.keyboard.press('Escape');await expect(popup).toBeHidden();await expect(warning).toBeFocused();expect(await rect()).toEqual(before);
  await warning.click();await expect(popup).toBeVisible();await page.getByRole('heading',{name:'Gantt',exact:true}).click();await expect(popup).toBeHidden();
  if(width===1440)await page.screenshot({path:info.outputPath(`warning-${mode.toLowerCase()}-closed.png`)});
  await page.locator('.gantt-row[data-entity-id="late"]').getByRole('button',{name:'Source task',exact:true}).click();const editor=page.getByRole('form',{name:'Quick edit task'});await expect(editor).toBeVisible();await editor.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.locator('.gantt-row[data-entity-id="late"] .gantt-warning')).toHaveCount(0);
 }
 await title.click();await expect(page.locator('nav [aria-current="page"]')).toHaveAttribute('aria-label','Milestones');await expect(page.locator('input[value="Warned gate"]')).toBeVisible();
});
