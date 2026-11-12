import {test,expect,type Page} from '@playwright/test';
import {makeProjectState,projectFixture,taskFixture} from '../../src/domain/test-fixtures';
import type {Milestone,Dependency} from '../../src/domain';
import {serializeProject} from '../../src/persistence/pmp/codec';
import type {AnalysisDiagnostic} from '../../src/domain/critical-path/types';
import {APP_VERSION} from '../../src/shared/app-info';
const gate=(index:number):Milestone=>({id:`gate-${index}`,projectId:'project-1',humanId:`MILESTONE-${String(index).padStart(3,'0')}`,name:'Shared milestone name',plannedDate:index===1?'2026-11-02':'2026-11-15',status:'Planned',scope:{kind:'project'},ownerId:null,relatedTaskIds:[],deletion:{isDeleted:false}});
const edge=(id:string,from:string,to:string):Dependency=>({id,projectId:'project-1',type:'Finish-to-Finish',predecessor:{kind:'milestone',id:from},successor:{kind:'milestone',id:to}});
const state=makeProjectState({project:projectFixture({metadata:{schemaVersion:2,minimumAppVersion:'1.7.0',gettingStartedCompleted:true}}),tasks:[taskFixture({id:'source',humanId:'TASK-001',name:'Source task',scope:{kind:'project'},startDate:'2026-11-01',endDate:'2026-11-10'}),taskFixture({id:'bad-task',humanId:'TASK-002',name:'Reversed task',scope:{kind:'project'},startDate:'2026-11-10',endDate:'2026-11-02'})],milestones:Array.from({length:63},(_,i)=>gate(i+1)),dependencies:[...Array.from({length:60},(_,i)=>edge(`filler-${String(i).padStart(2,'0')}`,`gate-${i+2}`,`gate-${i+3}`)),{id:'warning-edge-target',projectId:'project-1',type:'Finish-to-Finish',predecessor:{kind:'task',id:'source'},successor:{kind:'milestone',id:'gate-1'}}]});
async function open(page:Page,mode?:"multiple"|"missing"){
 await page.setViewportSize({width:1280,height:720});await page.clock.setFixedTime(new Date('2026-11-02T12:00:00Z'));
 const source=mode==='multiple'?{...state,dependencies:[...state.dependencies,edge('cycle-z','gate-62','gate-63'),edge('cycle-a','gate-61','gate-63')]}:state;
 // Persisted projects correctly reject cycles. Exercise defensive multi-link and
 // stale diagnostic UI at the worker boundary; genuine SCC metadata has unit coverage.
 if(mode)await page.addInitScript(({mode})=>{
  const NativeWorker=window.Worker;
  window.Worker=class extends NativeWorker{
   constructor(url:string|URL,options?:WorkerOptions){super(url,options);this.addEventListener('message',(event:MessageEvent<{result?:{diagnostics:AnalysisDiagnostic[]}}>)=>{
    if(!event.data.result)return;
    event.data.result.diagnostics.push(mode==='multiple'?{id:'injected-cycle',entityId:'gate-62',kind:'milestone',code:'cycle',dependencyIds:['cycle-z','cycle-a'],description:'Activity belongs to a circular dependency chain. Review Dependencies.'}:{id:'injected-stale',entityId:'gate-63',kind:'milestone',code:'reference',dependencyId:'removed-dependency',description:'Review the unavailable relationship.'});
   });}
  };
 },{mode});
 const saved=serializeProject(source,{createdAt:'2026-11-01T00:00:00Z',lastSavedAt:'2026-11-01T00:00:00Z',runtimeVersion:APP_VERSION});if(!saved.ok)throw Error(JSON.stringify(saved.errors));
 await page.addInitScript(({bytes})=>{const data=new Uint8Array(bytes);Object.assign(window,{showOpenFilePicker:async()=>[{name:'warning-dependencies.pmp',getFile:async()=>({name:'warning-dependencies.pmp',size:data.length,lastModified:1,arrayBuffer:async()=>data.slice().buffer})}]});},{bytes:[...saved.value]});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();await nav(page,'Warnings');await expect(page.getByRole('button',{name:'Go to MILESTONE-001: Critical path analysis',exact:true})).toBeVisible();
}
const nav=async(page:Page,module:string)=>page.locator('nav').getByRole('button',{name:module,exact:true}).click();
const milestoneWarning=(page:Page)=>page.getByRole('button',{name:'Go to MILESTONE-001: Critical path analysis',exact:true});
const row=(page:Page,id='warning-edge-target')=>page.locator(`[data-navigation-id="${id}"]`);
async function revealed(page:Page,id='warning-edge-target'){
 await expect(page.locator('nav').getByRole('button',{name:'Dependencies',exact:true})).toHaveAttribute('aria-current','page');await expect(row(page,id)).toHaveClass(/navigation-target/);await expect(row(page,id)).toBeInViewport();await expect(row(page,id)).toBeFocused();
}

test('task warning still reveals its owning task; milestone warning reveals an off-screen exact dependency',async({page})=>{
 await open(page);await page.getByRole('button',{name:'Go to TASK-002: Invalid date range',exact:true}).click();await expect(page.locator('nav').getByRole('button',{name:'Tasks',exact:true})).toHaveAttribute('aria-current','page');await expect(page.locator('[data-navigation-id="bad-task"]')).toHaveClass(/navigation-target/);
 await nav(page,'Warnings');await milestoneWarning(page).click();await revealed(page);expect(await page.getByRole('region',{name:'Dependencies results',exact:true}).evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
 await expect(row(page).getByRole('button',{name:'Edit dependency warning-edge-target',exact:true})).toBeVisible();await expect(page.locator('.navigation-target')).toHaveCount(1);await expect(page.getByRole('button',{name:'Save Now',exact:true,includeHidden:true})).toBeDisabled();
});

test('query, relationship filters and sort survive reveal and Escape restores the filtered view',async({page})=>{
 await open(page);await nav(page,'Dependencies');await page.getByRole('button',{name:'Predecessor',exact:true}).click();await page.getByRole('button',{name:'Predecessor',exact:true}).click();
 await page.getByRole('searchbox',{name:'Search dependencies',exact:true}).fill('no-matching-relationship');await page.locator('.filter-trigger').click();await page.getByRole('checkbox',{name:'Cross-stream only',exact:true}).check();await page.keyboard.press('Escape');
 await nav(page,'Warnings');await milestoneWarning(page).click();await revealed(page);await expect(page.getByRole('searchbox',{name:'Search dependencies',exact:true})).toHaveValue('no-matching-relationship');
 await page.locator('.filter-trigger').click();await expect(page.getByRole('checkbox',{name:'Cross-stream only',exact:true})).toBeChecked();await page.keyboard.press('Escape');await page.keyboard.press('Escape');await expect(row(page)).toHaveCount(0);await expect(page.getByRole('searchbox',{name:'Search dependencies',exact:true})).toHaveValue('no-matching-relationship');await expect(page.getByRole('button',{name:'Save Now',exact:true,includeHidden:true})).toBeDisabled();
 await page.getByRole('searchbox',{name:'Search dependencies',exact:true}).fill('');await page.locator('.filter-trigger').click();await page.getByRole('checkbox',{name:'Cross-stream only',exact:true}).uncheck();await page.keyboard.press('Escape');
 const ids=await page.locator('.dependency-table tbody tr').evaluateAll(nodes=>nodes.map(node=>(node as HTMLElement).dataset.navigationId));expect(ids[0]).toBe('warning-edge-target');expect(ids.at(-1)).toBe('filler-00');
});

test('multi-link milestone diagnostic offers deterministic stable-ID choices and repeated selections reveal each link',async({page})=>{
 await open(page,'multiple');const warning=page.getByRole('button',{name:'Go to MILESTONE-062: Critical path analysis',exact:true});await expect(warning).toBeVisible();const card=page.locator('.warning-list li').filter({has:warning});
 await card.locator('summary').click();expect(await card.locator('.warning-dependency-targets button').allTextContents()).toEqual(['Dependency cycle-a','Dependency cycle-z']);
 await card.getByRole('button',{name:'Dependency cycle-z',exact:true}).press('Enter');await revealed(page,'cycle-z');await nav(page,'Warnings');await warning.click();await revealed(page,'cycle-a');await expect(page.locator('.navigation-target')).toHaveCount(1);await expect(page.getByRole('button',{name:'Save Now',exact:true,includeHidden:true})).toBeDisabled();
});


test('missing dependency diagnostic explains its fallback and reveals the owning milestone only',async({page})=>{
 await open(page,'missing');const warning=page.getByRole('button',{name:'Go to MILESTONE-063: Critical path analysis',exact:true});const card=page.locator('.warning-list li').filter({has:warning});await expect(card).toContainText('No dependency can be identified');
 await warning.click();await expect(page.locator('nav').getByRole('button',{name:'Milestones',exact:true})).toHaveAttribute('aria-current','page');await expect(page.locator('[data-navigation-id="gate-63"]')).toHaveClass(/navigation-target/);await expect(page.locator('[data-navigation-id="gate-63"]')).toBeInViewport();await expect(page.locator('.dependencies-panel')).toHaveCount(0);await expect(page.getByRole('button',{name:'Save Now',exact:true,includeHidden:true})).toBeDisabled();
});
