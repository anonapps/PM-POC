import { settleSidebar } from './sidebar-animation';
import { openProjectDetails } from './project-details';
import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeProject} from '../../src/persistence/pmp/codec';
import {globalAction} from './global-actions';
const bytes=[...readFileSync('src/testing/fixtures/regression-180.pmp')];
const modules=['Overview','Search','Streams','People','Tasks','Gantt','Milestones','Tube Map','Risk Log','Decision Log','Baselines','Dependencies','Warnings','Settings'];
async function open(page:Page){
 page.on("pageerror",error=>console.error("SHELL PAGE ERROR",error.message));
 await page.setViewportSize({width:1440,height:900});
 await page.addInitScript(({bytes})=>{
  let data=new Uint8Array(bytes),modified=1;
  const control={delay:false,fail:false,release:undefined as undefined|(()=>void)};
  const handle={name:'shell.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:modified,arrayBuffer:async()=>data.slice().buffer}},async createWritable(){
   if(control.fail)throw new Error('Test save failure');
   if(control.delay)await new Promise<void>(resolve=>{control.release=resolve});
   let pending=data;return{write:async(value:Uint8Array)=>{pending=new Uint8Array(value).slice()},close:async()=>{data=pending;modified++}};
  }};
  Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>handle,__shellControl:control,__shellBytes:()=>[...data]});
 },{bytes});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();await expect(page.locator('.sidebar-project strong')).toHaveText('Regression 180 records');
}
const toolbar=(page:Page)=>page.getByRole('toolbar',{name:'Project actions'});
const trigger=(page:Page)=>page.locator('.global-toolbar-trigger');
async function hoverTrigger(page:Page){const box=(await trigger(page).boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+5)}
async function edit(page:Page){await page.locator('nav').getByRole('button',{name:'People',exact:true}).click();const input=page.locator('input[aria-label="Name for PERSON-001"]');await input.fill('Shell regression person');await input.blur();await expect(page.locator('.sidebar-save-dot')).toHaveClass(/dirty/)}

test('all routes keep page controls fixed and clickable with an intrinsic toolbar overlay',async({page})=>{
 await open(page);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const moduleName of modules){
  await page.locator('nav').getByRole('button',{name:moduleName,exact:true}).click();await expect(toolbar(page)).toBeHidden();await expect(page.locator('.workspace'),moduleName).toBeVisible();
  const geometry=()=>page.locator('.workspace').evaluate(e=>[...e.querySelectorAll('h1,.title-row input,.title-row button,.title-row select')].map(node=>({text:node.getAttribute('aria-label')??node.textContent,box:node.getBoundingClientRect().toJSON()})));
  const before=await geometry();
  const overlap=await trigger(page).evaluate(strip=>{const s=strip.getBoundingClientRect();return [...document.querySelectorAll('.workspace button,.workspace input,.workspace select,.workspace summary')].filter(e=>e.checkVisibility({visibilityProperty:true})).some(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.left<s.right&&r.right>s.left&&r.top<s.bottom&&r.bottom>s.top})});expect(overlap,moduleName).toBe(false);
  const search=page.locator('.shared-search-filter input');if(await search.count()){await search.hover();await page.waitForTimeout(350);await expect(toolbar(page)).toBeHidden();await search.click();await expect(search).toBeFocused()}
  await page.keyboard.press('Alt+Shift+T');await expect(toolbar(page)).toBeVisible();expect(await geometry(),moduleName).toEqual(before);
  expect((await toolbar(page).boundingBox())!.width).toBeLessThan(300);
  await page.keyboard.press('Escape');await expect(toolbar(page)).toBeHidden();expect(await geometry()).toEqual(before);
 }
 await page.locator('nav').getByRole('button',{name:'Overview',exact:true}).click();
 await openProjectDetails(page);
 const dialog=page.getByRole('dialog',{name:'Project Details',exact:true}),longName='A long project name '.repeat(12).trim();
 await dialog.locator('input:not([type])').first().fill(longName);await dialog.getByRole('button',{name:'Done',exact:true}).click();
 const name=page.locator('.sidebar-project strong');await expect(name).toHaveText(longName);await expect(name).toHaveAttribute('title',longName);expect(await name.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('hover delay, trigger-only activation, leave grace, outside click and keyboard focus',async({page})=>{
 await open(page);await page.locator('nav').getByRole('button',{name:'Tasks',exact:true}).click();
 await page.locator('.sidebar-save-dot').hover();await page.waitForTimeout(350);await expect(toolbar(page)).toBeHidden();
 await hoverTrigger(page);await page.waitForTimeout(120);await expect(toolbar(page)).toBeHidden();await page.mouse.move(600,80);await page.waitForTimeout(350);await expect(toolbar(page)).toBeHidden();
 await hoverTrigger(page);await expect(toolbar(page)).toBeVisible();await toolbar(page).hover();await page.waitForTimeout(400);await expect(toolbar(page)).toBeVisible();
 await page.mouse.move(600,80);await page.waitForTimeout(120);await expect(toolbar(page)).toBeVisible();await expect(toolbar(page)).toBeHidden();
 const search=page.locator('.shared-search-filter input');await search.focus();await page.keyboard.press('Alt+Shift+T');await expect(toolbar(page)).toBeFocused();await page.keyboard.press('Alt+Shift+T');await page.keyboard.press('Escape');await expect(search).toBeFocused();
 await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('.global-floating-toolbar'))).toBe(false);
 await hoverTrigger(page);await expect(toolbar(page)).toBeVisible();await search.click();await expect(toolbar(page)).toBeHidden();await expect(search).toBeFocused();
 // Open popovers, text selection and active pointer drags must suppress activation.
 await page.locator('.filter-trigger').click();await hoverTrigger(page);await page.waitForTimeout(400);await expect(toolbar(page)).toBeHidden();await page.keyboard.press('Escape');await expect(page.locator('.filter-popover')).toHaveCount(0);
 await page.evaluate(()=>{window.getSelection()!.removeAllRanges();const range=document.createRange();range.selectNodeContents(document.querySelector('h1')!);window.getSelection()!.addRange(range)});
 await page.mouse.move(600,80);await hoverTrigger(page);await page.waitForTimeout(400);await expect(toolbar(page)).toBeHidden();await page.evaluate(()=>window.getSelection()!.removeAllRanges());
 await page.mouse.move(600,80);await page.mouse.down();await hoverTrigger(page);await page.waitForTimeout(400);await expect(toolbar(page)).toBeHidden();await page.mouse.up();
});

test('save states, reduced motion, actions, history and saved PMP bytes share runtime state',async({page})=>{
 await open(page);const dot=page.locator('.sidebar-save-dot');await expect(dot).toHaveClass(/saved/);await expect(dot).toHaveAttribute('title',/Saved · Last saved/);
 await page.keyboard.press('Alt+Shift+T');for(const name of ['Save Now','Undo','Redo'])await expect(toolbar(page).getByRole('button',{name,exact:true})).toBeDisabled();await page.keyboard.press('Escape');
 await page.locator('nav').getByRole('button',{name:'People',exact:true}).click();const originalName=await page.locator('input[aria-label="Name for PERSON-001"]').inputValue();await edit(page);await expect(dot).toHaveAttribute('title',/Unsaved · Last saved/);
 await globalAction(page,'Undo');await expect(page.locator('input[aria-label="Name for PERSON-001"]')).toHaveValue(originalName);await globalAction(page,'Redo');await expect(page.locator('input[aria-label="Name for PERSON-001"]')).toHaveValue('Shell regression person');await expect(dot).toHaveClass(/dirty/);
 await page.evaluate(()=>{(window as unknown as {__shellControl:{delay:boolean}}).__shellControl.delay=true});
 await globalAction(page,'Save Now');await expect(dot).toHaveClass(/saving/);expect(await dot.evaluate(e=>getComputedStyle(e).animationName)).toBe('sidebar-saving');
 await page.emulateMedia({reducedMotion:'reduce'});expect(await dot.evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 await page.evaluate(()=>{(window as unknown as {__shellControl:{release:()=>void}}).__shellControl.release()});await expect(dot).toHaveClass(/saved/);
 const saved=deserializeProject(new Uint8Array(await page.evaluate(()=>(window as unknown as {__shellBytes:()=>number[]}).__shellBytes())));expect(saved.ok).toBe(true);if(saved.ok)expect(saved.value.projectState.people[0].name).toBe('Shell regression person');
 await page.locator('input[aria-label="Name for PERSON-001"]').fill('Failure test');await page.locator('input[aria-label="Name for PERSON-001"]').blur();
 await page.evaluate(()=>{const c=(window as unknown as {__shellControl:{delay:boolean;fail:boolean}}).__shellControl;c.delay=false;c.fail=true});
 await globalAction(page,'Save Now');await expect(dot).toHaveClass(/failed/);await expect(dot).toHaveAttribute('title',/Save failed · Last saved/);await expect(page.locator('.workspace .alert')).toContainText('Your current work remains in memory');
 await page.evaluate(()=>{(window as unknown as {__shellControl:{fail:boolean}}).__shellControl.fail=false});await globalAction(page,'Save Now');await expect(dot).toHaveClass(/saved/);
});

for(const height of [900,600,480,420])test(`sidebar fits without navigation changes at ${height}px`,async({page},info)=>{
 await open(page);await page.locator('nav').getByRole('button',{name:'Tasks',exact:true}).click();await page.setViewportSize({width:1440,height});
 for(const collapsed of [false,true]){
  if(collapsed)await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();await settleSidebar(page);
  const geometry=await page.locator('#project-sidebar').evaluate(sidebar=>{const box=sidebar.getBoundingClientRect(),project=sidebar.querySelector('.sidebar-project')!.getBoundingClientRect(),toggle=sidebar.querySelector('.sidebar-toggle')!.getBoundingClientRect();return{width:box.width,overflow:getComputedStyle(sidebar).overflowY,project:project.toJSON(),toggle:toggle.toJSON(),items:[...sidebar.querySelectorAll('nav button')].map(e=>({label:e.getAttribute('aria-label'),rect:e.getBoundingClientRect().toJSON()})),horizontal:[...sidebar.querySelectorAll("*")].filter(e=>e.checkVisibility({visibilityProperty:true})).some(e=>e.getBoundingClientRect().right>box.right)}});
  expect(geometry.width).toBe(collapsed?64:232);expect(geometry.horizontal).toBe(false);expect(geometry.overflow).toBe('clip');expect(geometry.items.map(i=>i.label)).toEqual(modules);
  for(const item of geometry.items){expect(item.rect.bottom,item.label!).toBeLessThanOrEqual(height);expect(item.rect.left).toBeGreaterThanOrEqual(0);expect(item.rect.right).toBeLessThanOrEqual(geometry.width)}
  expect(geometry.project.bottom).toBeLessThanOrEqual(geometry.items[0].rect.top);expect(geometry.project.right).toBeLessThanOrEqual(collapsed?geometry.width:geometry.toggle.left);
  await expect(page.locator('.sidebar-project strong')).toBeVisible({visible:!collapsed});expect((await page.locator('.sidebar-save-dot').boundingBox())!.width).toBe(4);
  if(height===900||height===600){await page.screenshot({path:info.outputPath(`${height}-${collapsed?'collapsed':'expanded'}-hidden.png`)});await page.keyboard.press('Alt+Shift+T');await page.screenshot({path:info.outputPath(`${height}-${collapsed?'collapsed':'expanded'}-visible.png`)});await page.keyboard.press('Escape')}
 }
});
