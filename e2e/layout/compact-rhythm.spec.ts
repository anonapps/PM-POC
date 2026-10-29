import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeProject} from '../../src/persistence/pmp';
import {deriveProjectWarnings} from '../../src/features/warnings/warnings';
const bytes=[...readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')];
const decoded=deserializeProject(new Uint8Array(bytes));if(!decoded.ok)throw new Error('Invalid fixture');const state=decoded.value.projectState;
async function open(page:Page){await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes),modified=Date.now();const handle={name:'compact-rhythm.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:modified,arrayBuffer:async()=>data.slice().buffer};},async createWritable(){return{write:async(value:Uint8Array)=>{data=new Uint8Array(value);},close:async()=>{modified++;}};}};Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>handle});},{bytes});await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();}
async function nav(page:Page,name:string){await page.getByRole('navigation',{name:'Project modules'}).getByRole('button',{name,exact:true}).click();}
test('record rows and heading bands remove empty lower space without displacing fields',async({page},info)=>{
 await page.setViewportSize({width:1366,height:768});await open(page);
 for(const [name,label] of [['People','Name for PERSON-001'],['Streams','Name for STREAM-001'],['Tasks','Name for TASK-001'],['Milestones','Name for MILESTONE-001'],['Risk Log','Title for RISK-001'],['Decision Log','Title for DECISION-001']]){
  await nav(page,name);if(name==='Risk Log')await page.getByRole('button',{name:'Risk Matrix',exact:true}).click();
  const input=page.getByLabel(label,{exact:true}),row=input.locator('xpath=ancestor::tr[1]');
  const geometry=await input.evaluate(e=>{const r=e.getBoundingClientRect(),row=e.closest('tr')!.getBoundingClientRect();return {height:row.height,tail:row.bottom-r.bottom,top:r.top-row.top};});
  expect(geometry.height,name).toBeLessThanOrEqual(64);expect(geometry.tail,name).toBeLessThanOrEqual(7);expect(geometry.tail,name).toBeGreaterThanOrEqual(1);expect(geometry.top,name).toBeGreaterThanOrEqual(15);
  expect((await page.locator('thead').boundingBox())!.height,name).toBeLessThanOrEqual(38);
  const centers=await row.locator('input:not([type=checkbox]),select,summary,.status,.risk-level-chip,.table-actions>button').evaluateAll(nodes=>nodes.filter(e=>!e.closest('.multi-select-options,.relationship-options')).map(e=>{const r=e.getBoundingClientRect();return r.y+r.height/2;}));
  expect(Math.max(...centers)-Math.min(...centers),name).toBeLessThan(3);
  if(['Streams','Tasks','Milestones'].includes(name))await page.screenshot({path:info.outputPath(`${name}-compact.png`)});
 }
 await nav(page,'Milestones');const pills=page.locator('tbody tr').filter({has:page.getByLabel('Name for MILESTONE-002',{exact:true})});
 expect(await pills.locator('.scope-pill').count()).toBeGreaterThan(1);await expect(pills.locator('summary.scope-summary')).toBeVisible();
 const scope=await pills.locator('summary.scope-summary').boundingBox();expect(scope!.height).toBeGreaterThan(36);
 const band=await pills.locator('input:not([type=checkbox]),select,summary:not(.scope-summary),.table-actions>button').evaluateAll(nodes=>nodes.filter(e=>!e.closest('.multi-select-options,.relationship-options')).map(e=>{const r=e.getBoundingClientRect();return r.y+r.height/2;}));expect(Math.max(...band)-Math.min(...band)).toBeLessThan(3);
 const badge=page.locator('.milestone-warning').first(),warningRow=badge.locator('xpath=ancestor::tr[1]');
 const centers=await warningRow.locator('input:not([type=checkbox]),select,summary:not(.scope-summary),.table-actions>button').evaluateAll(nodes=>nodes.filter(e=>!e.closest('.multi-select-options,.relationship-options')).map(e=>{const r=e.getBoundingClientRect();return r.y+r.height/2;}));expect(Math.max(...centers)-Math.min(...centers)).toBeLessThan(3);
 const badgeText=await badge.locator('summary').evaluate(e=>{const range=document.createRange();range.selectNodeContents(e);return [...range.getClientRects()].map(r=>({top:r.top,bottom:r.bottom}));});expect(Math.max(...badgeText.map(r=>r.top))-Math.min(...badgeText.map(r=>r.top))).toBeLessThan(3);
 await badge.locator('summary').click();await expect(page.locator('.anchored-options:popover-open')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.anchored-options:popover-open')).toHaveCount(0);
});
test('warning content navigates by keyboard and description click without an Open button',async({page},info)=>{
 await page.setViewportSize({width:1366,height:768});await open(page);await nav(page,'Warnings');
 const warning=deriveProjectWarnings(state).find(w=>['Tasks','Milestones','Streams','People','Risk Log','Decision Log'].includes(w.destination))!;
 const content=page.getByRole('button',{name:`Go to ${warning.humanId}: ${warning.type}`,exact:true}).first();
 await expect(page.locator('.warning-list').getByRole('button',{name:'Open',exact:true})).toHaveCount(0);await content.focus();await content.press('Enter');
 await expect(page.getByRole('navigation',{name:'Project modules'}).getByRole('button',{name:warning.destination,exact:true})).toHaveAttribute('aria-current','page');await expect(page.locator('tr.navigation-target').first()).toContainText(warning.humanId);
 await nav(page,'Warnings');await page.screenshot({path:info.outputPath('warnings-clickable.png')});await content.locator('.warning-description').click();await expect(page.locator('tr.navigation-target').first()).toContainText(warning.humanId);
});
test('Dependencies follows compact font tokens and preserves complete warning text and inspection',async({page},info)=>{
 await page.setViewportSize({width:1366,height:768});await open(page);await nav(page,'Tasks');const expected=await page.locator('tbody tr td').first().evaluate(e=>getComputedStyle(e).fontSize);await nav(page,'Dependencies');
 const table=page.locator('.dependency-table');await expect(table).toHaveCSS('display','table');
 for(const cell of await table.locator('tbody tr').first().locator('td').all())await expect(cell).toHaveCSS('font-size',expected);
 expect((await table.locator('thead').boundingBox())!.height).toBeLessThanOrEqual(38);expect((await table.locator('tbody tr').first().boundingBox())!.height).toBeLessThanOrEqual(42);
 const warning=table.locator('tbody tr').first().locator('td').nth(4);expect(await warning.getAttribute('title')).toBe(await warning.textContent());
 await page.screenshot({path:info.outputPath('dependencies-compact.png')});await table.getByRole('button',{name:/^Edit dependency /}).first().click();await expect(page.getByRole('dialog',{name:'Edit dependency',exact:true})).toBeVisible();
});
for(const width of [900,1024,1152,1280,1366,1440,1920])test(`desktop Gantt Search matches People size and position at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await open(page);
 for(const collapsed of [false,true]){
  if(collapsed)await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
  await nav(page,'People');const reference=(await page.locator('.shared-search-filter').boundingBox())!;
  await nav(page,'Gantt');const simple=(await page.locator('.gantt-panel .shared-search-filter').boundingBox())!;expect(simple).toEqual(reference);
  await page.getByRole('button',{name:'Extended',exact:true}).click();const extended=(await page.locator('.gantt-panel .shared-search-filter').boundingBox())!;expect(extended).toEqual(reference);
 }
});

test('boxed fields reuse a centered internal text band across pages and sizes',async({page},info)=>{
 await page.setViewportSize({width:1366,height:900});await open(page);
 for(const name of ['People','Streams','Tasks','Milestones','Risk Log','Decision Log','Gantt']){
  await nav(page,name);if(name==='Gantt')await page.getByRole('button',{name:'Extended',exact:true}).click();
  const table=page.locator(name==='Gantt'?'.gantt-tasks-pane table.fit-table':'table.fit-table').first();
  const controls=table.locator('tbody tr').first().locator('input:not([type=checkbox]):not([type=radio]),select,textarea,details.multi-select>summary:not(:has(.scope-pill)):not(.scope-summary)');
  const metrics=await controls.evaluateAll(nodes=>nodes.filter(e=>!e.closest('.multi-select-options,.relationship-options')).map(e=>{
   const style=getComputedStyle(e),rect=e.getBoundingClientRect();let textCenter:number|null=null;
   if(e.tagName==='SUMMARY'){const range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect();textCenter=text.top+text.height/2;}
   return {tag:e.tagName,line:style.lineHeight,inset:style.paddingLeft,top:parseFloat(style.paddingTop),bottom:parseFloat(style.paddingBottom),height:rect.height,font:style.fontFamily,weight:style.fontWeight,textOffset:textCenter===null?null:textCenter-(rect.top+rect.height/2)};
  }));
  expect(metrics.length,name).toBeGreaterThan(1);
  for(const field of metrics){expect(field.line,`${name} ${field.tag}`).toBe('20px');expect(field.inset,name).toBe('8px');expect(field.top,name).toBe(field.bottom);expect(field.top*2+22,name).toBe(field.height);expect(field.font,name).toBe('Arial, Helvetica, sans-serif');expect(field.weight,name).toBe('400');if(field.textOffset!==null)expect(Math.abs(field.textOffset),`${name} rendered selector text`).toBeLessThanOrEqual(1.5);}
  for(const select of await controls.all()){if(await select.evaluate(e=>e.tagName==='SELECT')){const fit=await select.evaluate(e=>{const select=e as HTMLSelectElement,style=getComputedStyle(e),canvas=document.createElement('canvas'),context=canvas.getContext('2d')!;context.font=`${style.fontSize} ${style.fontFamily}`;return {text:context.measureText(select.selectedOptions[0]?.textContent??'').width,available:e.getBoundingClientRect().width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-2};});expect(fit.text,name).toBeLessThanOrEqual(fit.available);}}
  if(name==='Streams')await page.screenshot({path:info.outputPath('shared-field-text-streams.png')});
 }
 await nav(page,'Tasks');await page.getByRole('button',{name:'Add Task',exact:true}).click();
 const panel=page.locator('.creation-fields--task');
 for(const field of await panel.locator('input:not([type=checkbox]):not([type=radio]),select,.predictive-select>summary:not(:has(.scope-pill)),.relationship-picker>summary').all()){
  const popupSearch=await field.evaluate(e=>Boolean(e.closest('.multi-select-options,.relationship-options')));
  await expect(field).toHaveCSS('line-height','20px');await expect(field).toHaveCSS('padding-left','8px');await expect(field).toHaveCSS('height',popupSearch?'34px':'30px');
  if(!popupSearch&&await field.evaluate(e=>e.tagName!=='SUMMARY'))await expect(field).toHaveCSS('font-size','13px');
 }
 await page.screenshot({path:info.outputPath('shared-field-text-create-task.png')});
});

for(const width of [900,1280,1440])test(`Tasks selection column aligns and preserves select-all in both views at ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await open(page);
 for(const collapsed of [false,true]){
  if(collapsed)await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
  for(const extended of [false,true]){
   await nav(page,extended?'Gantt':'Tasks');if(extended)await page.getByRole('button',{name:'Extended',exact:true}).click();
   const table=page.locator(extended?'.gantt-tasks-pane table.tasks-table':'.workspace>.panel>table.tasks-table');
   const header=table.getByRole('checkbox',{name:'Select all visible tasks',exact:true}),rows=table.locator('tbody>tr>td:first-child>input[type=checkbox]');
   const h=(await header.boundingBox())!;
   for(const row of (await rows.all()).slice(0,5)){const r=(await row.boundingBox())!;expect(r.x+r.width/2).toBeCloseTo(h.x+h.width/2,0);}
   const band=await table.locator('thead th').first().evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {center:(r.top+parseFloat(s.borderTopWidth)+parseFloat(s.paddingTop)+r.bottom-parseFloat(s.borderBottomWidth)-parseFloat(s.paddingBottom))/2};});expect(h.y+h.height/2).toBeCloseTo(band.center,0);
   await header.focus();await header.press('Space');await expect(rows.first()).toBeChecked();await expect(header).toBeChecked();
   await header.press('Space');await expect(rows.first()).not.toBeChecked();await rows.first().check();expect(await header.evaluate(e=>(e as HTMLInputElement).indeterminate)).toBe(true);await rows.first().uncheck();await expect(header).not.toBeChecked();
   if(width===1440&&!collapsed&&!extended)await page.screenshot({path:info.outputPath('standalone-tasks-selection-aligned.png')});
  }
 }
});
