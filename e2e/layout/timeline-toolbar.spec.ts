import {test,expect,type Page} from '@playwright/test';
import {makeProjectState,streamFixture,taskFixture} from '../../src/domain/test-fixtures';
import {readFileSync} from 'node:fs';
import {deserializeProject,serializeProject} from '../../src/persistence/pmp/codec';
const decoded=deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));
if(!decoded.ok)throw new Error('Invalid legacy fixture');
const fixture=decoded.value;
const pages=['Search','Streams','People','Tasks','Gantt','Milestones','Risk Log','Tube Map','Decision Log','Warnings'];
async function openProject(page:Page,range?:[string,string],source=fixture.projectState){
 const state=range?{...source,project:{...source.project,startDate:range[0],endDate:range[1]}}:source;
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
  if(process.env.CAPTURE_LAYOUT==='1')await page.screenshot({path:testInfo.outputPath(`${width}-${name.replaceAll(' ','-')}-centred.png`)});
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
 const footer=page.getByRole('navigation',{name:'Gantt date navigation'}),chart=page.locator('.gantt'),range=footer.locator('span[data-start]');
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
  expect(await chart.evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollLeft===0)).toBe(true);
  await page.getByRole('button',{name:'Collapse All',exact:true}).click();await expect(range).toHaveAttribute('data-start',start!);
  await page.getByRole('button',{name:'Expand All',exact:true}).click();
  await chart.evaluate(e=>{e.scrollTop=0;e.scrollLeft=0;});
 }
 if(process.env.CAPTURE_LAYOUT==='1')await page.screenshot({path:testInfo.outputPath(`${width}-Gantt-footer.png`)});await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
});

// PR #12: footer paint must not extend scroll overflow and unstick the axis.
for(const width of [1440,1080,768,375])for(const length of ['short','long'])test(`Tube Map sticky bounds at ${width} with ${length} streams`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});await openProject(page);
 await page.locator('nav').getByRole('button',{name:'Tube Map',exact:true}).click();
 if(length==='short')await page.locator('.shared-search-filter input').fill(fixture.projectState.streams[0].name);
 await page.getByRole('combobox').selectOption('date');
 for(const label of await page.locator('.tube-axis>span').allTextContents())expect(label).toMatch(/^\d{2}\/\d{2}$/);
 expect(await page.locator('.tube-axis>span').evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).textAlign==='center'))).toBe(true);
 await page.getByRole('combobox').selectOption('week');
 const laneCount=await page.locator('.tube-line').count();expect(length==='short'?laneCount<5:laneCount>=31).toBe(true);
 const workspace=page.locator('.workspace');
 // Include the axis/footer in the bound; no decorative paint should add a viewport of scrolling.
 const overflow=await workspace.evaluate(w=>{const panel=w.querySelector('section.panel.tube-map')!,bounds=w.getBoundingClientRect(),end=panel.getBoundingClientRect().bottom-bounds.top+w.scrollTop;return w.scrollHeight-Math.max(w.clientHeight,end);});
 expect(overflow).toBeLessThan(40);
 for(const fraction of [0,.5,1]){
  await workspace.evaluate((w,f)=>{w.scrollTop=(w.scrollHeight-w.clientHeight)*f;},fraction);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const geometry=await page.locator('.tube-axis').evaluate(axis=>{const toolbar=document.querySelector('.page-toolbar')!.getBoundingClientRect(),w=document.querySelector('.workspace')!.getBoundingClientRect(),r=axis.getBoundingClientRect();return{axisTop:r.top,toolbarBottom:toolbar.bottom,workspaceBottom:w.bottom,labels:axis.querySelectorAll('span').length};});
  expect(geometry.axisTop).toBeGreaterThanOrEqual(geometry.toolbarBottom-2);expect(geometry.axisTop).toBeLessThan(geometry.workspaceBottom);expect(geometry.labels).toBe(12);
  const footer=page.getByRole('navigation',{name:'Tube Map date navigation'});const rect=(await footer.boundingBox())!;expect(rect.y+rect.height).toBeLessThanOrEqual(902);expect(rect.y).toBeGreaterThan(geometry.toolbarBottom);
 }
 const last=(await page.locator('.tube-line').last().boundingBox())!,footer=(await page.getByRole('navigation',{name:'Tube Map date navigation'}).boundingBox())!;
 expect(last.y+last.height).toBeLessThanOrEqual(footer.y+1);
 if(process.env.CAPTURE_LAYOUT==='1')await page.screenshot({path:testInfo.outputPath(`${width}-Tube-${length}-sticky.png`)});
 await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
});

for(const width of [900,1024,1280,1440,1920])test(`v1.6 all modules fit viewport at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await openProject(page);
 for(const name of ["Overview",...pages,"Baselines","Dependencies","File Information"]){
  await page.locator('nav').getByRole('button',{name,exact:true}).click();
  await expect.poll(()=>page.locator('.workspace').evaluate(e=>e.scrollWidth-e.clientWidth),{message:`${name} workspace must fit`}).toBeLessThanOrEqual(1);
  expect(await page.locator('.panel').first().evaluate(e=>e.scrollWidth-e.clientWidth),`${name} panel`).toBeLessThanOrEqual(1);
  const outside=await page.locator('.panel input:visible,.panel select:visible,.panel button:visible,.panel summary:visible').evaluateAll(nodes=>nodes.filter(node=>{const r=node.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>window.innerWidth+1);}).map(n=>n.getAttribute('aria-label')??n.textContent));
  expect(outside,`${name} controls must remain accessible`).toEqual([]);
 }
});

for(const moduleName of ['Gantt','Tube Map'])test(`dependency connectors are traceable in ${moduleName}`,async({page},testInfo)=>{
 await page.setViewportSize({width:1440,height:900});await page.clock.setFixedTime(new Date('2026-10-27T12:00:00Z'));
 const names=['Design','Build','Review','Test','Approve','Launch'];
 const streams=[0,1,2].map(i=>streamFixture({id:`stream-${i}`,humanId:`STREAM-00${i+1}`,name:['Planning','Delivery','Launch'][i]}));
 const tasks=names.map((name,i)=>taskFixture({id:`task-${i}`,humanId:`TASK-00${i+1}`,name,scope:{kind:'project'},startDate:`2026-10-${25+i}`,endDate:`2026-10-${26+i}`}));
 const milestones=names.map((name,i)=>({...fixture.projectState.milestones[0],id:`milestone-${i}`,humanId:`MILESTONE-00${i+1}` as const,name:`${name} gate`,scope:{kind:'streams' as const,streamIds:[streams[Math.floor(i/2)].id]},plannedDate:`2026-11-${String(2+i*3).padStart(2,'0')}`,relatedTaskIds:[]}));
 const dependencies=(['task','milestone'] as const).flatMap(kind=>[[0,1],[0,3],[1,4],[2,3],[3,5]].map(([from,to],i)=>({id:`${kind}-link-${i}`,projectId:'project-1',predecessor:{kind,id:`${kind}-${from}`},successor:{kind,id:`${kind}-${to}`},type:'Finish-to-Start' as const})));
 await openProject(page,undefined,makeProjectState({streams,tasks,milestones,dependencies,identifierSequences:fixture.projectState.identifierSequences}));
 await page.locator('nav').getByRole('button',{name:moduleName,exact:true}).click();
 const links=page.locator('.dependency-connection');expect(await links.count()).toBeGreaterThan(1);
 if(process.env.CAPTURE_LAYOUT==='1')await page.screenshot({path:testInfo.outputPath(`${moduleName}-dependency-overview.png`)});
 expect(await page.locator('.dependency-connectors').evaluate(e=>{const matrix=(e as SVGSVGElement).getScreenCTM()!;return Math.abs(matrix.a-matrix.d);})).toBeLessThan(.01);
 const first=links.first();await expect(first).toHaveAttribute('aria-label',/ → .*Finish-to-Start/);
 await expect(first.locator('.dependency-line')).toHaveAttribute('d',/ C /);
 await expect(first.locator('.dependency-line')).toHaveAttribute('marker-end',/url/);
 const mutedItems=()=>page.locator(moduleName==='Gantt'?'.gantt-row.dependency-muted':'.tube-station.dependency-muted');
 const colouredItems=()=>page.locator(moduleName==='Gantt'?'.gantt-row.task:not(.dependency-muted)':'.tube-station:not(.dependency-muted)');
 const point=async()=>first.locator('.dependency-hit').evaluate(element=>{const path=element as SVGPathElement,p=path.getPointAtLength(path.getTotalLength()/2),screen=new DOMPoint(p.x,p.y).matrixTransform(path.getScreenCTM()!);return{x:screen.x,y:screen.y};});
 expect(await first.locator('.dependency-line').evaluate(e=>getComputedStyle(e).stroke)).toBe('rgb(167, 174, 184)');
 expect(await first.locator('.dependency-line').evaluate(e=>getComputedStyle(e).strokeDasharray)).not.toBe('none');
 await first.focus();await expect(first).toBeFocused();
 expect(await first.locator('.dependency-line').evaluate(e=>getComputedStyle(e).strokeWidth)).toBe('2.5px');
 expect(await links.nth(1).evaluate(e=>getComputedStyle(e).opacity)).toBe('0.18');
 await expect(colouredItems()).toHaveCount(2);expect(await mutedItems().count()).toBeGreaterThan(0);
 if(moduleName==='Gantt')await expect(page.locator('.gantt-row.milestone:not(.dependency-muted)')).toHaveCount(0);
 const target=await point();await page.mouse.click(target.x,target.y);await expect(first).toHaveAttribute('aria-pressed','true');
 await page.mouse.move(10,10);await expect(first).toHaveAttribute('data-active','true');
 await links.nth(1).focus();await page.keyboard.press('Enter');await expect(links.locator('xpath=self::*[@aria-pressed="true"]')).toHaveCount(1);
 await expect(links.nth(1)).toHaveAttribute('aria-pressed','true');await expect(first).toHaveAttribute('data-active','false');
 await expect(page.locator('.dependency-connection[data-active=true]')).toHaveCount(1);await expect(colouredItems()).toHaveCount(2);
 if(process.env.CAPTURE_LAYOUT==='1')await page.screenshot({path:testInfo.outputPath(`${moduleName}-dependency-focus.png`)});
 await page.keyboard.press('Escape');await expect(mutedItems()).toHaveCount(0);await expect(page.locator('.dependency-connection[aria-pressed=true]')).toHaveCount(0);
 await page.getByRole('button',{name:moduleName==='Gantt'?'Gantt':'Tube Map',exact:true}).first().focus();
 const hover=await point();await page.mouse.move(hover.x,hover.y);await expect(first).toHaveAttribute('data-active','true');await expect(colouredItems()).toHaveCount(2);
 await page.mouse.move(10,10);await expect(first).toHaveAttribute('data-active','false');await expect(mutedItems()).toHaveCount(0);
 await page.locator('.filter-trigger').click();await page.getByRole('checkbox',{name:'Hide dependencies',exact:true}).check();await expect(links).toHaveCount(0);
 await expect(page.getByRole('checkbox',{name:'Dependencies',exact:true})).not.toBeChecked();await expect(mutedItems()).toHaveCount(0);
 if(process.env.CAPTURE_LAYOUT==='1')await page.screenshot({path:testInfo.outputPath(`${moduleName}-hide-dependencies-filter.png`)});
 await page.getByRole('button',{name:'Clear all',exact:true}).click();await page.keyboard.press('Escape');expect(await links.count()).toBeGreaterThan(1);
 await expect(page.locator('.dependency-connection[data-active=true]')).toHaveCount(0);
 await page.getByRole('checkbox',{name:'Dependencies',exact:true}).uncheck();await expect(links).toHaveCount(0);
 await page.getByRole('checkbox',{name:'Dependencies',exact:true}).check();expect(await links.count()).toBeGreaterThan(1);
 await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
});

for(const width of [900,1280,1440])test(`timeline footers share compact geometry at ${width}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});await openProject(page);
 const inspect=async(name:string)=>{
  const footer=page.getByRole('navigation',{name:`${name} date navigation`});
  return footer.evaluate(element=>{const style=getComputedStyle(element),button=element.querySelector('button')!,b=getComputedStyle(button);return{height:element.getBoundingClientRect().height,padding:style.padding,gap:style.gap,font:style.fontFamily,size:style.fontSize,button:{height:button.getBoundingClientRect().height,font:b.fontFamily,size:b.fontSize,weight:b.fontWeight,padding:b.padding,radius:b.borderRadius,border:b.borderColor},legend:element.querySelector('.timeline-navigation-legend-row')!.getBoundingClientRect().height};});
 };
 await page.locator('nav').getByRole('button',{name:'People',exact:true}).click();const titleHeight=(await page.locator('.page-toolbar').boundingBox())!.height;
 await page.locator('nav').getByRole('button',{name:'Gantt',exact:true}).click();const standard=await inspect('Gantt');expect(standard.height).toBe(56);expect(standard.height).toBeLessThanOrEqual(titleHeight);expect(standard.button.height).toBe(30);
 if(process.env.CAPTURE_LAYOUT==='1')await page.screenshot({path:testInfo.outputPath(`${width}-Gantt-compact-footer.png`)});
 await page.getByRole('button',{name:'Extended',exact:true}).click();expect(await inspect('Gantt')).toEqual(standard);
 await page.locator('nav').getByRole('button',{name:'Tube Map',exact:true}).click();expect(await inspect('Tube Map')).toEqual(standard);
 await expect(page.getByRole('button',{name:'Previous 4 weeks',exact:true})).toHaveText('← Previous');
 await expect(page.getByRole('button',{name:'Next 4 weeks',exact:true})).toHaveText('Next →');
 await expect(page.locator('.timeline-navigation-context')).toContainText(/before.*connections.*after/);
 await page.locator('.workspace').evaluate(e=>{e.scrollTop=e.scrollHeight;});
 const footerBottom=await page.getByRole('navigation',{name:'Tube Map date navigation'}).evaluate(e=>e.getBoundingClientRect().bottom);
 const workspaceBottom=await page.locator('.workspace').evaluate(e=>e.getBoundingClientRect().bottom);
 expect(Math.abs(footerBottom-workspaceBottom)).toBeLessThanOrEqual(1);
 expect(await page.locator('.workspace').evaluate(e=>getComputedStyle(e).paddingBottom)).toBe('0px');
 if(process.env.CAPTURE_LAYOUT==='1')await page.screenshot({path:testInfo.outputPath(`${width}-Tube-compact-footer.png`)});
 await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
});
