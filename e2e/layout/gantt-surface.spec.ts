import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeProject,serializeProject} from '../../src/persistence/pmp/codec';
import {captureSchedule} from '../../src/domain/baselines';
const decoded=deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));if(!decoded.ok)throw new Error('Invalid fixture');
const fixture=decoded.value,source=fixture.projectState;
const approved={...source,tasks:source.tasks.map((task,index)=>index?task:{...task,name:'Baseline alignment task',startDate:'2026-10-25',endDate:'2026-10-27'})};
const state={...approved,tasks:approved.tasks.map((task,index)=>index?task:{...task,endDate:'2026-10-31'}),baselines:[{id:'approved',name:'Approved plan',createdAt:'2026-10-26T12:00:00Z',snapshot:captureSchedule(approved)}]};
const encoded=serializeProject(state,{createdAt:fixture.manifest.createdAt,lastSavedAt:fixture.manifest.lastSavedAt,runtimeVersion:'1.6.0'});if(!encoded.ok)throw new Error('Cannot serialize fixture');const bytes=[...encoded.value];
async function open(page:Page){await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes);const handle={name:'gantt-surface.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:1,arrayBuffer:async()=>data.slice().buffer};},async createWritable(){return{write:async(value:Uint8Array)=>{data=new Uint8Array(value);},close:async()=>{}};}};Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>handle});},{bytes});await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();}
async function nav(page:Page,name:string){await page.getByRole('navigation',{name:'Project modules'}).getByRole('button',{name,exact:true}).click();}
for(const [width,height] of [[900,700],[1280,900],[1440,900],[1920,1080]])test(`Gantt standard controls, docked footer and full Extended pane at ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height});await open(page);await nav(page,'People');
 const standard=await page.getByRole('button',{name:'Add Person',exact:true}).evaluate(e=>({font:getComputedStyle(e).fontSize,height:e.getBoundingClientRect().height}));
 await nav(page,'Gantt');
 for(const extended of [false,true]){
  if(extended)await page.getByRole('button',{name:'Extended',exact:true}).click();
  const search=(await page.locator('.gantt-panel>.page-toolbar .shared-search-filter').boundingBox())!;
  for(const button of await page.locator('.gantt-panel>.page-toolbar .actions button').all()){await expect(button).toHaveCSS('font-size',standard.font);const r=(await button.boundingBox())!;expect(r.height).toBe(standard.height);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);if(Math.abs(r.y+r.height/2-search.y-search.height/2)<2)expect(r.x).toBeGreaterThanOrEqual(search.x+search.width+1);}
  await expect(page.locator('.gantt-zoom-control select')).toHaveCSS('font-size',standard.font);
  const workspace=(await page.locator('.gantt-workspace').boundingBox())!,footer=(await page.getByRole('navigation',{name:'Gantt date navigation'}).boundingBox())!,pane=(await page.locator('.gantt-pane').boundingBox());
  expect(workspace.y+workspace.height).toBeCloseTo(height,0);
  if(extended){expect(footer.y+footer.height).toBeCloseTo(pane!.y+pane!.height,0);const lower=(await page.locator('.gantt-tasks-pane').boundingBox())!;expect(lower.y+lower.height).toBeCloseTo(height,0);
   const toolbar=page.locator('.gantt-tasks-pane .page-toolbar'),add=toolbar.getByRole('button',{name:'Add Task',exact:true});await add.focus();const rect=(await add.boundingBox())!;expect(rect.x+rect.width+3).toBeLessThanOrEqual(workspace.x+workspace.width);const title=(await toolbar.getByRole('heading',{name:'Tasks',exact:true}).boundingBox())!;expect(Math.abs(title.y+title.height/2-rect.y-rect.height/2)).toBeLessThan(2);
   const heads=await page.locator('.gantt-tasks-pane thead').first().locator('input[type=checkbox],button').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2;}));expect(Math.max(...heads)-Math.min(...heads)).toBeLessThan(2);
   await add.click();await expect(page.getByRole('dialog',{name:'Create Task',exact:true})).toBeVisible();await page.getByRole('dialog',{name:'Create Task',exact:true}).getByRole('button',{name:'Cancel',exact:true}).click();
  }else expect(footer.y+footer.height).toBeCloseTo(height,0);
  expect((await page.locator('.baseline-controls').boundingBox())!.height).toBeLessThanOrEqual(width>1100?40:80);
  if(extended){const splitter=page.getByRole('separator',{name:'Resize Gantt and Tasks panes',exact:true});await splitter.focus();for(let step=0;step<30;step++)await splitter.press('ArrowUp');const task=(await page.locator('.gantt-row.task>div').first().boundingBox())!,heading=(await page.locator('.gantt-item-heading').boundingBox())!,footer=(await page.getByRole('navigation',{name:'Gantt date navigation'}).boundingBox())!;expect(task.y).toBeGreaterThanOrEqual(heading.y+heading.height-1);expect(task.y+task.height).toBeLessThanOrEqual(footer.y+1);}
  await page.screenshot({path:info.outputPath(`${width}-${extended?'extended':'simple'}-surface.png`)});
 }
});
test('baseline comparison uses substantial grey bars and red finish delay segments with independent toggles',async({page},info)=>{
 await page.setViewportSize({width:1440,height:900});await open(page);await nav(page,'Gantt');await page.getByLabel('Baseline overlay',{exact:true}).check();
 const row=page.locator('.gantt-row.task').filter({has:page.getByRole('button',{name:'Baseline alignment task',exact:true})});
 await expect(row.locator('.gantt-baseline')).toBeVisible();expect((await row.locator('.gantt-baseline').boundingBox())!.height).toBeGreaterThanOrEqual(12);await expect(row.locator('.gantt-baseline')).toHaveCSS('border-top-style','dashed');const historical=(await row.locator('.gantt-baseline').boundingBox())!,current=(await row.locator('.gantt-bar').boundingBox())!;expect(historical.y+historical.height).toBeGreaterThan(current.y+current.height+8);await expect(row.locator('.gantt-delay')).toHaveAttribute('aria-label',/4 days after baseline/);await expect(row.locator('.gantt-delay')).toHaveCSS('border-top-color','rgb(180, 35, 24)');
 await page.screenshot({path:info.outputPath('baseline-comparison-visible.png')});
 await page.getByLabel('Variance indicators',{exact:true}).check();await expect(row.locator('.variance-indicator')).toBeVisible();await page.getByLabel('Baseline overlay',{exact:true}).uncheck();await expect(row.locator('.gantt-baseline,.gantt-delay')).toHaveCount(0);await expect(row.locator('.variance-indicator')).toBeVisible();
});
test('dropdown search is visibly editable before focus and comparison text is centered',async({page},info)=>{
 await page.setViewportSize({width:1440,height:900});await open(page);await nav(page,'Gantt');const summary=page.locator('.baseline-selector summary');
 const offset=await summary.evaluate(e=>{const range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect(),box=e.getBoundingClientRect();return Math.abs(text.top+text.height/2-box.top-box.height/2);});expect(offset).toBeLessThanOrEqual(1.5);
 await summary.click();const input=page.getByRole('searchbox',{name:'Search Comparison baseline',exact:true});await expect(input).not.toBeFocused();await expect(input).toHaveCSS('border-top-style','solid');await expect(input).toHaveCSS('border-top-width','1px');await expect(input).toHaveAttribute('placeholder',/^Type to filter/);await input.fill('unavailable');await expect(page.getByText('No matching options',{exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(summary).toBeFocused();
 await nav(page,'Streams');await page.locator('tbody .predictive-select summary').first().click();const owner=page.getByRole('searchbox',{name:/^Search Owner for STREAM-/}).first();await expect(owner).toHaveCSS('border-top-style','solid');await expect(owner).toHaveAttribute('placeholder',/^Type to filter/);await page.screenshot({path:info.outputPath('shared-dropdown-search-input.png')});
});
