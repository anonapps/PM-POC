import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeProject,serializeProject} from '../../src/persistence/pmp/codec';
const decoded=deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));
if(!decoded.ok)throw new Error('Invalid legacy fixture');
const fixture=decoded.value;
const pages=['Search','Streams','People','Tasks','Gantt','Milestones','Risk Log','Tube Map','Decision Log','Warnings'];
async function openProject(page:Page,range?:[string,string]){
 const state=range?{...fixture.projectState,project:{...fixture.projectState.project,startDate:range[0],endDate:range[1]}}:fixture.projectState;
 const encoded=serializeProject(state,{createdAt:fixture.manifest.createdAt,lastSavedAt:fixture.manifest.lastSavedAt,runtimeVersion:'1.4.0',minimumRuntimeVersion:fixture.manifest.compatibility.minimumRuntimeVersion,configuration:fixture.configuration});
 if(!encoded.ok)throw new Error(JSON.stringify(encoded.errors));
 await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes);const modified=Date.now(),handle={name:'disposable-toolbar.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:modified,arrayBuffer:async()=>data.slice().buffer};},async createWritable(){return{write:async(value:Uint8Array)=>{data=new Uint8Array(value);},close:async()=>{}};}};Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>handle});},{bytes:[...encoded.value]});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();
}
async function centred(page:Page){
 const panel=await page.locator('.panel').boundingBox(),input=await page.locator('.shared-search-filter').boundingBox();
 expect(Math.abs(input!.x+input!.width/2-panel!.x-panel!.width/2)).toBeLessThan(1);
 expect(input!.width).toBe(340);expect(input!.height).toBe(34);
 const overlaps=await page.locator('.page-toolbar').evaluate(toolbar=>{const search=toolbar.querySelector('.shared-search-filter')!.getBoundingClientRect();return [...toolbar.children].filter(e=>!e.matches('.shared-search-filter')).some(e=>{const r=e.getBoundingClientRect();return Math.min(r.right,search.right)-Math.max(r.left,search.left)>1&&Math.min(r.bottom,search.bottom)-Math.max(r.top,search.top)>1;});});
 expect(overlaps).toBe(false);
 return input!.x+input!.width/2;
}
for(const width of [900,1024,1280,1440,1920])test(`independent search centre across all pages at ${width}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:1000});await openProject(page);
 let previousCentre:number|undefined;
 for(const name of pages){
  await page.locator('nav').getByRole('button',{name,exact:true}).click();
  const centre=await centred(page);if(previousCentre!==undefined)expect(Math.abs(centre-previousCentre)).toBeLessThan(1);previousCentre=centre;
  const input=page.locator('.shared-search-filter input');await input.evaluate(e=>{(e as HTMLInputElement).placeholder='A considerably longer placeholder that must never move the search field';});
  await expect(page.locator('.shared-search-filter button')).toHaveAttribute('aria-expanded','false');await page.locator('.shared-search-filter button').click();
  const checkbox=page.locator('.filter-popover input[type=checkbox]').first();if(await checkbox.count())await checkbox.check();
  expect(await centred(page)).toBeCloseTo(centre,0);
  await page.locator('.workspace').evaluate(e=>{e.scrollTop=150;});expect(await centred(page)).toBeCloseTo(centre,0);
  await page.keyboard.press('Escape');await expect(page.locator('.shared-search-filter button')).toBeFocused();
  await page.locator('.workspace').evaluate(e=>{e.scrollTop=0;});
  // Different action widths/absence cannot change the centre track.
  await page.locator('.page-toolbar>.header-actions').evaluateAll(elements=>elements.forEach(e=>(e as HTMLElement).style.visibility='hidden'));
  expect(await centred(page)).toBeCloseTo(centre,0);
  await page.screenshot({path:testInfo.outputPath(`${width}-${name.replaceAll(' ','-')}-centred.png`)});
 }
 await page.locator('.sidebar-toggle').click();await centred(page);
 await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
});
for(const width of [900,1280,1440,1920])for(const scenario of [
 {name:'short year-boundary project',today:'2026-12-31T12:00:00',range:['2026-12-28','2027-01-15'] as [string,string]},
 {name:'long leap-year project',today:'2028-02-29T12:00:00',range:['2020-01-01','2030-12-31'] as [string,string]},
])test(`Gantt footer at ${width}, ${scenario.name}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});await page.clock.setFixedTime(new Date(scenario.today));await openProject(page,scenario.range);
 await page.locator('nav').getByRole('button',{name:'Gantt',exact:true}).click();
 const footer=page.getByRole('navigation',{name:'Gantt date navigation'}),chart=page.locator('.gantt'),range=footer.locator('span');
 await expect(footer).toBeVisible();await expect(footer.locator('button')).toHaveCount(3);
 await expect(page.locator('.page-toolbar').getByRole('button',{name:/^(Previous|Today|Next)$/})).toHaveCount(0);
 expect(await footer.locator('button').allTextContents()).toEqual(['← Previous','Next →','Jump to today']);
 for(const [zoom,days] of [['Week',1],['Month',7],['Quarter',14]] as const){
  await page.locator('.gantt-zoom-control select').selectOption(zoom);await expect(footer.getByRole('button',{name:'Jump to today'})).toBeEnabled();
  const start=await range.getAttribute('data-start'),end=await range.getAttribute('data-end');
  await expect(range).toHaveText(/^\d{2}\/\d{2}\/\d{4} – \d{2}\/\d{2}\/\d{4}$/);
  expect((await page.locator('.gantt-dates span').first().getAttribute('title'))!.split(' – ')[0]).toBe(start);
  expect((await page.locator('.gantt-dates span').last().getAttribute('title'))!.split(' – ')[1]).toBe(end);
  await footer.getByRole('button',{name:'Next',exact:true}).click();
  expect((Date.parse((await range.getAttribute('data-start'))!)-Date.parse(start!))/86400000).toBe(days);
  await expect(footer.getByRole('button',{name:'Jump to today'})).toBeEnabled();
  await footer.getByRole('button',{name:'Previous',exact:true}).click();await expect(range).toHaveAttribute('data-start',start!);
  await footer.getByRole('button',{name:'Previous',exact:true}).click();
  expect((Date.parse(start!)-Date.parse((await range.getAttribute('data-start'))!))/86400000).toBe(days);
  await footer.getByRole('button',{name:'Jump to today'}).click();await expect(range).toHaveAttribute('data-start',start!);await expect(range).toHaveAttribute('data-end',end!);
  const body=await page.locator('.gantt-body').boundingBox(),marker=await page.locator('.timeline-today-marker').boundingBox();
  expect(marker).not.toBeNull();expect(Math.abs(marker!.y-body!.y)).toBeLessThan(1);expect(Math.abs(marker!.height-body!.height)).toBeLessThan(1);
  const initialFooter=await footer.boundingBox();await chart.evaluate(e=>{e.scrollTop=e.scrollHeight;e.scrollLeft=e.scrollWidth;});
  const scrolledFooter=await footer.boundingBox();expect(Math.abs(initialFooter!.y-scrolledFooter!.y)).toBeLessThan(1);expect(Math.abs(initialFooter!.x-scrolledFooter!.x)).toBeLessThan(1);expect(scrolledFooter!.y+scrolledFooter!.height).toBeLessThanOrEqual(900);
  const lastRow=await page.locator('.gantt-row').last().locator(':scope>div').first().boundingBox(),dependencies=await page.locator('.gantt-dependencies').boundingBox();
  expect(lastRow!.y+lastRow!.height).toBeLessThanOrEqual(scrolledFooter!.y+1);expect(dependencies!.y+dependencies!.height).toBeLessThanOrEqual(scrolledFooter!.y+1);
  if(width===900)expect(await chart.evaluate(e=>e.scrollWidth>e.clientWidth&&e.scrollLeft>0)).toBe(true);
  await page.getByRole('button',{name:'Collapse All',exact:true}).click();await expect(range).toHaveAttribute('data-start',start!);
  await page.getByRole('button',{name:'Expand All',exact:true}).click();
  await chart.evaluate(e=>{e.scrollTop=0;e.scrollLeft=0;});
 }
 await page.screenshot({path:testInfo.outputPath(`${width}-Gantt-footer.png`)});await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
});
