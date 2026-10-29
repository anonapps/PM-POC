import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
const bytes=[...readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')];
async function open(page:Page){
 await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes),modified=Date.now();const handle={name:'desktop-layout.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:modified,arrayBuffer:async()=>data.slice().buffer};},async createWritable(){return{write:async(value:Uint8Array)=>{data=new Uint8Array(value);},close:async()=>{modified++;}};}};Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>handle});},{bytes});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();
}
const modules=['People','Streams','Tasks','Milestones','Risk Log','Decision Log'];
for(const viewport of [{width:1366,height:768},{width:1280,height:720},{width:1152,height:720},{width:1024,height:640},{width:900,height:600}])test(`desktop record headers match fields at ${viewport.width}x${viewport.height}`,async({page},testInfo)=>{
 await page.setViewportSize(viewport);await open(page);
 for(const name of modules){
  await page.getByRole('navigation',{name:'Project modules'}).getByRole('button',{name,exact:true}).click();
  if(name==='Risk Log')await page.getByRole('button',{name:'Risk Matrix',exact:true}).click();
  const table=page.locator('.workspace>.panel>table.fit-table');await expect(table).toHaveCSS('display','table');
  const headings=await table.locator('thead th').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,height:r.height,overflow:e.scrollWidth-e.clientWidth,color:getComputedStyle(e).backgroundColor};}));
  const row=table.locator('tbody tr').first();const cells=await row.locator(':scope>td').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,height:r.height,before:getComputedStyle(e,'::before').content};}));
  expect(cells.length).toBe(headings.length);
  for(const [index,heading] of headings.entries()){
   expect(heading.y).toBeCloseTo(headings[0].y,0);expect(heading.height).toBe(headings[0].height);expect(heading.color).toBe(headings[0].color);expect(heading.overflow,name).toBeLessThanOrEqual(1);
   if(index)expect(heading.x).toBeCloseTo(headings[index-1].right,0);
   expect(cells[index].x).toBeCloseTo(heading.x,0);expect(cells[index].right).toBeCloseTo(heading.right,0);expect(cells[index].y).toBeCloseTo(cells[0].y,0);expect(['none','normal']).toContain(cells[index].before);
  }
  const controls=await row.locator(':scope>td>input,:scope>td>.status,:scope>td>.risk-level-chip,:scope>td>select,:scope>td>textarea,:scope>td>details>summary,:scope>td>.task-progress-field>input,:scope>td>.milestone-name-cell>input').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect(),cell=e.closest('td')!.getBoundingClientRect();return {name:e.getAttribute('aria-label'),center:r.y+r.height/2,inside:r.left>=cell.left-1&&r.right<=cell.right+1};}));
  expect(controls.filter(c=>!c.inside),name).toEqual([]);expect(Math.max(...controls.map(c=>c.center))-Math.min(...controls.map(c=>c.center)),name).toBeLessThan(3);
  expect(await page.locator('.workspace').evaluate(e=>e.scrollWidth-e.clientWidth),name).toBeLessThanOrEqual(1);
  if(viewport.width===1366&&['People','Streams','Risk Log'].includes(name))await page.screenshot({path:testInfo.outputPath(`${name.replaceAll(' ','-')}-desktop.png`)});
 }
});
for(const height of [400,480,600,720,768,900])test(`sidebar fits every module without scrolling at height ${height}`,async({page})=>{
 await page.setViewportSize({width:1280,height});await open(page);
 const sidebar=page.locator('#project-sidebar'),nav=page.getByRole('navigation',{name:'Project modules'});
 const names=await nav.getByRole('button').evaluateAll(nodes=>nodes.map(e=>e.getAttribute('aria-label')));
 await expect(nav.getByRole('button')).toHaveCount(14);
 const check=async()=>{
  const metrics=await sidebar.evaluate(e=>{const r=e.getBoundingClientRect();return {overflow:getComputedStyle(e).overflowY,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,top:r.top,bottom:r.bottom};});
  expect(metrics.overflow).toBe('clip');expect(metrics.scrollHeight-metrics.clientHeight).toBeLessThanOrEqual(1);
  const rows=await nav.getByRole('button').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
  for(const row of rows){expect(row.top).toBeGreaterThanOrEqual(metrics.top);expect(row.bottom).toBeLessThanOrEqual(metrics.bottom);}
  await sidebar.evaluate(e=>e.scrollTop=100);expect(await sidebar.evaluate(e=>e.scrollTop)).toBe(0);
  return rows.map(r=>r.top);
 };
 const positions=await check();await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();expect(await check()).toEqual(positions);expect(await nav.getByRole('button').evaluateAll(nodes=>nodes.map(e=>e.getAttribute('aria-label')))).toEqual(names);
 await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();expect(await check()).toEqual(positions);
 await nav.getByRole('button',{name:'File Information',exact:true}).click();await expect(nav.getByRole('button',{name:'File Information',exact:true})).toHaveAttribute('aria-current','page');
 await page.locator('.workspace').evaluate(e=>e.scrollTop=500);expect(await check()).toEqual(positions);
});
