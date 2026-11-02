import {test,expect,type Page} from '@playwright/test';
import {makeProjectState,projectFixture,streamFixture} from '../../src/domain/test-fixtures';
import {captureSchedule} from '../../src/domain/baselines';
import type {Milestone} from '../../src/domain/entities';
import {serializeProject,deserializeProject} from '../../src/persistence/pmp/codec';
import {APP_VERSION} from '../../src/shared/app-info';
const milestone=(id:string,date:string,streams:string[]=[]):Milestone=>({id,projectId:'project-1',humanId:`MILESTONE-${id.padStart(3,'0')}`,name:`Gate ${id}`,plannedDate:date,status:'Planned',ownerId:null,scope:streams.length?{kind:'streams',streamIds:streams}:{kind:'project'},relatedTaskIds:[],deletion:{isDeleted:false}});
const streams=[streamFixture({name:'Delivery'}),streamFixture({id:'stream-2',humanId:'STREAM-002',name:'Operations'})];
const original=makeProjectState({project:projectFixture({metadata:{schemaVersion:2,minimumAppVersion:'1.7.0',gettingStartedCompleted:true}}),streams,milestones:[milestone('1','2026-11-02'),milestone('2','2026-11-09',['stream-1','stream-2']),milestone('3','2026-11-16',['stream-1']),milestone('4','2027-01-24',['stream-2'])]});
const baseline={id:'original',name:'Original plan',createdAt:'2026-11-01T00:00:00Z',snapshot:captureSchedule(original)};
const source={...original,milestones:original.milestones.map(m=>m.id==='1'?{...m,plannedDate:'2026-11-09'}:m),baselines:[baseline,{...baseline,id:'second',name:'Second plan',snapshot:captureSchedule({...original,milestones:original.milestones.map(m=>({...m,plannedDate:'2026-11-23'}))})}]};
async function open(page:Page){
 await page.clock.setFixedTime(new Date('2026-11-02T12:00:00Z'));
 const saved=serializeProject(source,{createdAt:'2026-11-01T00:00:00Z',lastSavedAt:'2026-11-01T00:00:00Z',runtimeVersion:APP_VERSION});if(!saved.ok)throw Error(JSON.stringify(saved.errors));
 await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes);const handle={name:'tube-display.pmp',getFile:async()=>({name:'tube-display.pmp',size:data.length,lastModified:1,arrayBuffer:async()=>data.slice().buffer}),createWritable:async()=>({write:async(value:Uint8Array)=>{data=new Uint8Array(value)},close:async()=>{}})};Object.assign(window,{showOpenFilePicker:async()=>[handle],__tubeSaved:()=>[...data]});},{bytes:[...saved.value]});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();await page.locator('nav').getByRole('button',{name:'Tube Map',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'Show milestone names',exact:true})).toBeChecked();
}
const current=(page:Page,id='1')=>page.locator(`.tube-station[data-entity-id="${id}"] .tube-station-diamond`).first();
const historical=(page:Page,id='1')=>page.locator(`.tube-baseline-indicator[data-baseline-id="${id}"]`).first();
async function comparison(page:Page,mode:string){
 await page.getByRole('checkbox',{name:'Baseline milestones',exact:true}).setChecked(mode!=='off');
 if(mode!=='off')await page.getByRole('combobox',{name:'Baseline comparison display',exact:true}).selectOption(mode);
}
for(const mode of ['off','overlay','separate'])for(const names of [true,false])test(`${mode}, names ${names}: compact geometry, shared date alignment and unchanged data`,async({page},testInfo)=>{
 await page.setViewportSize({width:1280,height:800});await open(page);await comparison(page,mode);await page.getByRole('checkbox',{name:'Show milestone names',exact:true}).setChecked(names);
 await expect(page.locator('.tube-station-link')).toHaveCount(names?5:0);
 await expect(page.locator('.tube-baseline-name')).toHaveCount(mode==='off'||!names?0:5);
 await expect(page.locator('.tube-baseline-strip')).toHaveCount(mode==='separate'?1:0);await expect(page.locator('.tube-baseline-overlay')).toHaveCount(mode==='overlay'?1:0);
 await expect(page.getByRole('navigation',{name:'Tube Map date navigation',exact:true})).toHaveCount(1);await expect(page.locator('.baseline-selector summary')).toHaveCount(1);
 if(process.env.CAPTURE_LAYOUT)await page.screenshot({path:testInfo.outputPath('tube-display.png')});
 const lane=await page.locator('.tube-line').first().boundingBox();expect(lane!.height).toBe(mode==='overlay'?(names?136:76):(names?88:48));
 if(mode!=='off'){
  const old=await historical(page,'2').boundingBox(),live=await current(page,'2').boundingBox();expect(Math.abs(old!.x+old!.width/2-live!.x-live!.width/2)).toBeLessThan(1);
  const before=await historical(page).evaluate(node=>(node as HTMLElement).style.left);
  await page.getByRole('button',{name:'Next 4 weeks',exact:true}).click();await expect(historical(page)).toHaveCount(0);await page.getByRole('button',{name:'Jump to today',exact:true}).click();await expect(historical(page)).toBeVisible();expect(await historical(page).evaluate(node=>(node as HTMLElement).style.left)).toBe(before);
 }
 expect(await current(page).evaluate(node=>node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(24);await expect(current(page)).toHaveCSS('height','26px');
 const alignment=await current(page).evaluate(node=>{const station=node.closest<HTMLElement>('.tube-station')!,body=node.closest<HTMLElement>('.tube-body')!,box=node.getBoundingClientRect();return Math.abs(box.top+box.height/2-body.getBoundingClientRect().top-parseFloat(station.style.top));});expect(alignment).toBeLessThan(1);
 expect(await page.locator('.workspace').evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
 await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
});

test('one accessible tooltip for hover/focus, no native/pseudo tooltip, viewport-safe edges and Quick Edit',async({page})=>{
 await page.setViewportSize({width:900,height:700});await open(page);await comparison(page,'overlay');await page.getByRole('checkbox',{name:'Show milestone names',exact:true}).uncheck();
 for(const marker of [current(page),historical(page),historical(page,'4')]){
  await marker.scrollIntoViewIfNeeded();await marker.focus();await expect(page.getByRole('tooltip')).toHaveCount(1);await expect(marker).toHaveAttribute('aria-describedby',await page.getByRole('tooltip').getAttribute('id') as string);
  await expect(marker).not.toHaveAttribute('title');expect(await marker.evaluate(node=>getComputedStyle(node,'::after').content)).toBe('none');
  const tooltip=page.getByRole('tooltip');await expect(tooltip).toContainText('MILESTONE-');await expect(tooltip).toContainText('Scope:');const box=await tooltip.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(900);expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(700);
  await page.keyboard.press('Escape');await expect(tooltip).toHaveCount(0);
 }
 await historical(page).hover();await expect(page.getByRole('tooltip')).toContainText('Variance: +7 days');await expect(page.getByRole('tooltip')).toContainText('Status: Not captured in baseline');await page.getByRole('tooltip').hover();await expect(page.getByRole('tooltip')).toBeVisible();
 await current(page).click();await expect(page.getByRole('tooltip')).toHaveCount(0);await expect(page.getByRole('form',{name:'Quick edit milestone',exact:true})).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();
});

test('baseline selection, filters, axis and Quick Edit remain shared and snapshots survive save',async({page})=>{
 await open(page);await comparison(page,'separate');await page.locator('.baseline-selector summary').click();await page.getByRole('radio',{name:'Second plan',exact:true}).check();await expect(historical(page)).toHaveAttribute('aria-label',/2026-11-23/);
 await page.getByRole('combobox',{name:'Baseline comparison display',exact:true}).selectOption('overlay');await expect(historical(page)).toHaveAttribute('aria-label',/2026-11-23/);
 await page.getByRole('combobox',{name:'Axis',exact:true}).selectOption('date');await expect(page.locator('.tube-axis')).toContainText('02/11');
 await page.getByRole('searchbox',{name:'Search tube map',exact:true}).fill('Operations');await expect(page.locator('.tube-line')).toHaveCount(2);await expect(historical(page,'1')).toHaveCount(0);await page.getByRole('searchbox',{name:'Search tube map',exact:true}).fill('');
 await current(page).click();await page.getByRole('textbox',{name:'Milestone name',exact:true}).fill('Revised gate');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('button',{name:'Save Now',exact:true}).click();
 const loaded=deserializeProject(new Uint8Array(await page.evaluate(()=>(window as unknown as {__tubeSaved:()=>number[]}).__tubeSaved())));expect(loaded.ok).toBe(true);if(loaded.ok){expect(loaded.value.projectState.baselines).toEqual(source.baselines);expect(loaded.value.projectState.milestones.find(m=>m.id==='1')!.name).toBe('Revised gate');}
});
