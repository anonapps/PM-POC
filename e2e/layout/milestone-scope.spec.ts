import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeProject,serializeProject} from '../../src/persistence/pmp/codec';
import {captureSchedule} from '../../src/domain/baselines';
const loaded=deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));
if(!loaded.ok)throw new Error('Invalid fixture');
const source=loaded.value;
async function open(page:Page,stateOverride?:typeof source.projectState){
 const baseline={id:'baseline-original',name:'Original plan',description:'Approved schedule',createdAt:'2026-10-26T12:00:00Z',snapshot:captureSchedule(source.projectState)};
 const state=stateOverride??{...source.projectState,baselines:[baseline]};
 const saved=serializeProject(state,{createdAt:source.manifest.createdAt,lastSavedAt:source.manifest.lastSavedAt,runtimeVersion:'1.6.0'});if(!saved.ok)throw new Error(JSON.stringify(saved.errors));
 await page.addInitScript(({bytes})=>{let data=new Uint8Array(bytes),modified=Date.now();const handle={name:'v16-disposable.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:modified,arrayBuffer:async()=>data.slice().buffer};},async createWritable(){return{write:async(value:Uint8Array)=>{data=new Uint8Array(value);},close:async()=>{modified=Date.now();}};}};Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>handle,__v16Saved:()=>[...data]});},{bytes:[...saved.value]});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();
}
async function nav(page:Page,name:string){await page.locator('nav').getByRole('button',{name,exact:true}).click();}

for (const width of [1280, 1920]) test(`milestone scopes stay single line and overflow opens selector at ${width}`, async ({page}) => {
 await page.setViewportSize({width,height:1000});
 const streams=source.projectState.streams.filter(s=>!s.deletion.isDeleted).map((s,i)=>({...s,name:`Scope ${i+1} ${s.name}`}));
 expect(streams.length).toBeGreaterThan(1);
 const state={...source.projectState,streams,milestones:source.projectState.milestones.map((m,i)=>({...m,scope:i===0?{kind:'streams' as const,streamIds:streams.map(s=>s.id)}:{kind:'project' as const}}))};
 await open(page,state);await nav(page,'Milestones');
 const row=page.locator('.milestones-table tbody tr').first();
 const summary=row.locator('summary.scope-summary');
 const count=summary.locator('.scope-overflow-pill');
 await expect(count).toHaveText(`+${streams.length-1}`);
 const initialHeight=(await row.boundingBox())!.height;
 await count.click();
 const options=row.locator('.multi-select-options').first();
 await expect(options).toBeVisible();
 for(const stream of streams) await expect(options.getByRole('checkbox',{name:stream.name,exact:true})).toBeChecked();
 for(const stream of streams.slice(1)) await options.getByRole('checkbox',{name:stream.name,exact:true}).uncheck();
 await expect(count).toHaveCount(0);
 await page.keyboard.press('Escape');
 expect((await row.boundingBox())!.height).toBe(initialHeight);
 await expect(summary).toBeFocused();
 await summary.press('Enter');await expect(options).toBeVisible();
 await options.getByRole('checkbox',{name:streams[1].name,exact:true}).check();
 await expect(count).toHaveText('+1');
 expect((await row.boundingBox())!.height).toBe(initialHeight);
 await options.getByRole('radio',{name:'Project-wide',exact:true}).check();
 await expect(count).toHaveCount(0);
 await expect(summary).toContainText('Project-wide');
 expect((await row.boundingBox())!.height).toBe(initialHeight);
});
