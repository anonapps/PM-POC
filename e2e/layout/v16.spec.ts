import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeProject,serializeProject} from '../../src/persistence/pmp/codec';
import {captureSchedule} from '../../src/domain/baselines';
const loaded=deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));
if(!loaded.ok)throw new Error('Invalid fixture');
const source=loaded.value;
async function open(page:Page){
 const baseline={id:'baseline-original',name:'Original plan',description:'Approved schedule',createdAt:'2026-10-26T12:00:00Z',snapshot:captureSchedule(source.projectState)};
 const state={...source.projectState,baselines:[baseline]};
 const saved=serializeProject(state,{createdAt:source.manifest.createdAt,lastSavedAt:source.manifest.lastSavedAt,runtimeVersion:'1.6.0'});if(!saved.ok)throw new Error(JSON.stringify(saved.errors));
 await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes),modified=Date.now();const handle={name:'v16-disposable.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:modified,arrayBuffer:async()=>data.slice().buffer};},async createWritable(){return{write:async(value:Uint8Array)=>{data=new Uint8Array(value);},close:async()=>{modified=Date.now();}};}};Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>handle,__v16Saved:()=>[...data]});},{bytes:[...saved.value]});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();
}
async function nav(page:Page,name:string){await page.locator('nav').getByRole('button',{name,exact:true}).click();}
test('baseline lifecycle, selection, undo, save/reopen and visual controls',async({page},testInfo)=>{
 await page.setViewportSize({width:1440,height:1000});await open(page);await nav(page,'Baselines');
 await expect(page.locator('.baseline-list li')).toHaveCount(1);
 await page.getByRole('button',{name:'Create baseline',exact:true}).click();
 await page.getByRole('dialog').locator('input').fill('Delivery commitment');await page.getByRole('dialog').locator('textarea').fill('Second approved snapshot');await page.getByRole('dialog').getByRole('button',{name:'Create',exact:true}).click();
 await expect(page.locator('.baseline-list li')).toHaveCount(2);
 await page.getByRole('button',{name:'Rename Delivery commitment',exact:true}).click();await page.getByRole('dialog').locator('input').fill('Approved delivery');await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByRole('button',{name:'Approved delivery',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Original plan',exact:true}).click();await expect(page.getByRole('button',{name:'Original plan',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.screenshot({path:testInfo.outputPath('baseline-comparison.png'),fullPage:true});
 await page.getByRole('button',{name:'Delete Approved delivery',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.baseline-list li')).toHaveCount(2);
 await page.getByRole('button',{name:'Delete Approved delivery',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Delete baseline',exact:true}).click();await expect(page.locator('.baseline-list li')).toHaveCount(1);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('.baseline-list li')).toHaveCount(2);
 await page.getByRole('button',{name:'Save Now',exact:true}).click();await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
 const bytes=await page.evaluate(()=> (window as unknown as {__v16Saved:()=>number[]}).__v16Saved());const reopened=deserializeProject(new Uint8Array(bytes));expect(reopened.ok&&reopened.value.projectState.baselines?.map(b=>b.name)).toEqual(['Original plan','Approved delivery']);
 await nav(page,'Gantt');await page.getByLabel('Baseline overlay',{exact:true}).check();await expect(page.locator('.gantt-baseline').first()).toBeVisible();for(const zoom of ['Month','Quarter','Week']){await page.locator('.gantt-zoom-control select').selectOption(zoom);await expect(page.locator('.gantt-baseline').first()).toBeVisible();}await page.getByLabel('Variance indicators',{exact:true}).check();await expect(page.locator('.variance-indicator').first()).toBeVisible();await page.getByRole('checkbox',{name:'Dependencies',exact:true}).uncheck();await expect(page.locator('.gantt-connectors>path')).toHaveCount(0);await page.screenshot({path:testInfo.outputPath('gantt-baseline.png')});
 await nav(page,'Tube Map');await page.getByLabel('Baseline milestones',{exact:true}).check();await expect(page.getByRole('region',{name:'Baseline milestone indicators'})).toBeVisible();await page.getByRole('checkbox',{name:'Dependencies',exact:true}).uncheck();await expect(page.locator('.tube-connections>path')).toHaveCount(0);await page.screenshot({path:testInfo.outputPath('tube-baseline.png')});
 await nav(page,'File Information');await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.getByRole('button',{name:'Open Project',exact:true}).click();await nav(page,'Baselines');await expect(page.locator('.baseline-list li')).toHaveCount(2);
});
test('dependency filters, editor, invalid self reference, warning recalculation and Undo',async({page},testInfo)=>{
 await page.setViewportSize({width:1280,height:1000});await open(page);await nav(page,'Dependencies');
 const rows=page.locator('.dependency-table tbody tr');expect(await rows.count()).toBeGreaterThan(0);
 await page.locator('.shared-search-filter button').click();await page.getByLabel('Cross-stream only',{exact:true}).check();await page.keyboard.press('Escape');
 await page.locator('.shared-search-filter button').click();await page.getByLabel('Cross-stream only',{exact:true}).uncheck();await page.keyboard.press('Escape');
 await rows.first().getByRole('button',{name:/^Edit dependency /}).click();await expect(page.getByRole('dialog',{name:'Edit dependency'})).toBeVisible();
 const dialog=page.getByRole('dialog',{name:'Edit dependency'}),predecessor=await dialog.locator('summary[aria-label="Dependency predecessor"]').getAttribute('data-value'),successor=await dialog.locator('summary[aria-label="Dependency successor"]').getAttribute('data-value');
 const pickSuccessor=async(value:string)=>{await dialog.locator('summary[aria-label="Dependency successor"]').click();await page.locator('.multi-select-options:popover-open').locator(`input[value="${value}"]`).click();};
 await pickSuccessor(predecessor!);await expect(dialog.getByRole('alert')).toContainText('Self-references');await expect(dialog.getByRole('button',{name:'Save dependency',exact:true})).toBeDisabled();await pickSuccessor(successor!);
 await page.getByLabel('Dependency type',{exact:true}).selectOption('Start-to-Start');await page.getByRole('button',{name:'Save dependency',exact:true}).click();await expect(rows.first()).toContainText('Start-to-Start');
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(rows.first()).not.toContainText('Start-to-Start');await page.screenshot({path:testInfo.outputPath('cross-stream-dependencies.png')});
});
