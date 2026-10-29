import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {deserializeProject} from '../../src/persistence/pmp';
const bytes=[...readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')];
const original=deserializeProject(new Uint8Array(bytes));if(!original.ok)throw new Error('Invalid legacy fixture');const state=original.value.projectState;
const cases=[['People','Person','person','Person name','people'],['Streams','Stream','stream','Stream name','streams'],['Tasks','Task','task','Task name','tasks'],['Milestones','Milestone','milestone','Name','milestones'],['Risk Log','Risk','risk','Risk title','risks'],['Decision Log','Decision','decision','Title','decisions']] as const;
async function setup(page:Page,open=true){await page.addInitScript(({bytes})=>{
 let data=new Uint8Array(bytes),modified=Date.now(),writes=0,pickers=0;
 const handle={name:'disposable-panels.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:modified,arrayBuffer:async()=>data.slice().buffer};},async createWritable(){let pending=data;return{write:async(value:Uint8Array)=>{pending=new Uint8Array(value).slice();},close:async()=>{data=pending;modified++;writes++;}};}};
 Object.assign(window,{showOpenFilePicker:async()=>[handle],showSaveFilePicker:async()=>{pickers++;return handle;},__panelBytes:()=>[...data],__panelCounts:()=>({writes,pickers})});
 },{bytes});await page.goto('/');if(open)await page.getByRole('button',{name:'Open Project',exact:true}).click();}
async function choose(page:Page,label:string,value:string){await page.locator('.creation-backdrop').locator(`summary[aria-label="${label}"]`).click();await page.locator('.multi-select-options:popover-open').locator(`input[value="${value}"]`).click();}
async function related(page:Page,label:string,humanId:string){await page.locator('.creation-backdrop .relationship-picker>summary').filter({hasText:new RegExp(`^${label} ·`)}).click();await page.locator('.relationship-options:popover-open label').filter({hasText:humanId}).locator('input').check();await page.keyboard.press('Escape');}
for(const width of [1024,1440,1920])for(const [moduleName,entity,kind,label,collection] of cases)test(`${entity} full creation panel at ${width}`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:1000});await setup(page);await page.locator('nav').getByRole('button',{name:moduleName,exact:true}).click();
 const add=page.getByRole('button',{name:`Add ${entity}`,exact:true}),before=await page.locator('.shared-search-filter').boundingBox();await add.click();const panel=page.getByRole('dialog',{name:`Create ${entity}`,exact:true});const name=panel.getByLabel(label,{exact:true});
 await expect(panel).toHaveAttribute('aria-modal','true');await expect(name).toBeFocused();expect((await panel.boundingBox())!.x+(await panel.boundingBox())!.width).toBe(width);await expect(page.locator('.panel>form')).toHaveCount(0);await expect(page.locator('.shared-search-filter input')).toBeDisabled();
 const inputBoxes=await panel.locator('input,select,textarea').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
 await panel.getByRole('button',{name:'Create',exact:true}).click();await expect(name).toBeFocused();await expect(name).toHaveAttribute('aria-invalid','true');
 expect(await panel.locator('input,select,textarea').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}))).toEqual(inputBoxes);
 // Enter from an optional single-line field validates even with the name blank.
 if(kind==='person'){await panel.getByLabel('Role',{exact:true}).fill('Lead QA');await panel.getByLabel('Role',{exact:true}).press('Enter');await expect(name).toBeFocused();}
 await name.fill('équipe XML');await name.press('Tab');expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('.creation-backdrop')))).toBe(true);await page.keyboard.press('Shift+Tab');await expect(name).toBeFocused();
 const notes=panel.getByLabel(kind==='person'?'Notes':kind==='decision'?'Additional information':'Description',{exact:true});await notes.fill('line ONE');await notes.press('End');await notes.press('Enter');await notes.pressSequentially('line TWO');await expect(panel).toBeVisible();await expect(notes).toHaveValue('line ONE\nline TWO');
 if(kind==='milestone')await panel.getByLabel('Date',{exact:true}).fill('2028-02-29');if(kind==='decision')await panel.getByLabel('Decision date',{exact:true}).fill('2028-02-29');
 if(kind!=='person')await choose(page,'Owner',state.people[1].id);
 if(kind==='stream'||kind==='task'){await panel.getByLabel('Start date',{exact:true}).fill('2028-02-28');await panel.getByLabel('End date',{exact:true}).fill('2028-03-02');await panel.getByLabel('Priority',{exact:true}).selectOption('High');}
 if(kind==='task'){await choose(page,'Scope',state.streams[1].id);await panel.getByLabel('Progress',{exact:true}).fill('35');await related(page,'Predecessor tasks',state.tasks[1].humanId);await choose(page,'Milestone',state.milestones[1].id);}
 if(kind==='milestone'){await panel.getByLabel('Project-wide',{exact:true}).uncheck();await related(page,'Streams',state.streams[1].humanId);await related(page,'Streams',state.streams[2].humanId);await related(page,'Related tasks',state.tasks[1].humanId);await related(page,'Predecessors',state.tasks[1].humanId);}
 if(kind==='risk'||kind==='decision'){await related(page,'Tasks',state.tasks[1].humanId);if(kind==='decision'){await related(page,'Risks',state.risks[1].humanId);await panel.getByLabel('Project-wide (exclusive)',{exact:true}).check();}else{await panel.getByRole('button',{name:'Add action',exact:true}).click();await panel.getByLabel('Action description 1',{exact:true}).fill('mitigation PLAN');await panel.getByLabel('Action due date 1',{exact:true}).fill('2028-03-02');}}
 if(process.env.CAPTURE_LAYOUT==='1')await page.screenshot({path:testInfo.outputPath(`${width}-${kind}-panel.png`)});
 // Submitting from any ordinary single-line input follows the same full validation.
 await name.press('Enter');await expect(panel).toHaveCount(0);await expect(add).toBeFocused();await expect(page.locator('.shared-search-filter input')).toHaveValue('');expect((await page.locator('.shared-search-filter').boundingBox())!.x).toBe(before!.x);
 await page.getByRole('button',{name:'Save Now',exact:true}).click();await expect(page.locator('.save-state')).toContainText('Saved');
 const encoded=await page.evaluate(()=> (window as unknown as {__panelBytes:()=>number[]}).__panelBytes()),decoded=deserializeProject(new Uint8Array(encoded));expect(decoded.ok).toBe(true);if(!decoded.ok)return;
 const created=decoded.value.projectState[collection].at(-1)!;expect(decoded.value.projectState[collection]).toHaveLength(state[collection].length+1);expect('name'in created?created.name:created.title).toBe('Équipe XML');
 if(kind==='person')expect(created).toMatchObject({notes:'Line ONE\nline TWO'});else expect(created).toMatchObject({ownerId:state.people[1].id});
 if(kind==='task'){expect(created).toMatchObject({scope:{kind:'stream',streamId:state.streams[1].id},progress:35,milestoneId:state.milestones[1].id});expect(decoded.value.projectState.dependencies).toHaveLength(state.dependencies.length+1);}
 if(kind==='milestone')expect(created).toMatchObject({scope:{kind:'streams',streamIds:[state.streams[1].id,state.streams[2].id]},relatedTaskIds:[state.tasks[1].id]});
 if(kind==='decision')expect(created).toMatchObject({projectWide:true,relatedStreamIds:[],relatedMilestoneIds:[],relatedTaskIds:[state.tasks[1].id],relatedRiskIds:[state.risks[1].id]});
 if(kind==='risk')expect(created).toMatchObject({actions:[{description:'Mitigation PLAN',dueDate:'2028-03-02'}]});
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('tbody')).not.toContainText(created.humanId);await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.locator('tbody')).toContainText(created.humanId);
 // Reopening always clears the transient draft. Clean outside closes; dirty outside confirms; Cancel skips warning.
 await add.click();await expect(panel.getByLabel(label,{exact:true})).toHaveValue('');await page.mouse.click(20,400);await expect(panel).toHaveCount(0);await add.click();await panel.getByLabel(label,{exact:true}).fill('Discard me');await page.mouse.click(20,400);
 const confirmation=page.getByRole('dialog',{name:'Discard unsaved changes?',exact:true});await expect(confirmation).toBeVisible();await confirmation.getByRole('button',{name:'Stay',exact:true}).click();await expect(panel.getByLabel(label,{exact:true})).toHaveValue('Discard me');await page.mouse.click(20,400);await confirmation.getByRole('button',{name:'Discard',exact:true}).click();await expect(panel).toHaveCount(0);await add.click();await panel.getByLabel(label,{exact:true}).fill('Cancel me');await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(panel).toHaveCount(0);await expect(confirmation).toHaveCount(0);
});
test('New Project requires explicit valid Status and never writes invalid drafts',async({page})=>{
 await setup(page,false);await page.getByRole('button',{name:'New Project',exact:true}).click();const create=page.getByRole('button',{name:'Choose File & Create',exact:true});await expect(page.getByLabel('Status',{exact:true})).toHaveValue('');await expect(create).toBeDisabled();const boxes=await page.locator('form input,form select,form textarea').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().y));
 await page.getByLabel('Project name',{exact:true}).press('Enter');await expect(create).toBeDisabled();expect(await page.locator('form input,form select,form textarea').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().y))).toEqual(boxes);
 await page.getByLabel('Project name',{exact:true}).fill('Disposable project');await page.getByLabel('Start date',{exact:true}).fill('2028-02-29');await page.getByLabel('End date',{exact:true}).fill('2028-02-28');await page.getByLabel('Status',{exact:true}).selectOption('In Progress');await expect(create).toBeDisabled();await page.locator('form').evaluate(e=>(e as HTMLFormElement).requestSubmit());expect(await page.evaluate(()=> (window as unknown as {__panelCounts:()=>unknown}).__panelCounts())).toEqual({writes:0,pickers:0});await page.getByLabel('End date',{exact:true}).fill('2028-03-01');await expect(create).toBeEnabled();await create.click();await expect(page.locator('.project-name-inline')).toContainText('Disposable project');expect(await page.evaluate(()=> (window as unknown as {__panelCounts:()=>{pickers:number}}).__panelCounts().pickers)).toBe(1);
});
test('task bulk toolbar, scope pills, tall rows and horizontal context editors',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await setup(page);await page.locator('nav').getByRole('button',{name:'Tasks',exact:true}).click();const search=await page.locator('.shared-search-filter').boundingBox();await page.getByLabel('Select TASK-001',{exact:true}).check();await page.getByLabel('Select TASK-002',{exact:true}).check();const bulk=page.getByRole('button',{name:'Delete selected (2)',exact:true});await expect(bulk).toBeVisible();expect(await bulk.evaluate(e=>Boolean(e.closest('.page-toolbar')))).toBe(true);expect((await page.locator('.shared-search-filter').boundingBox())!.x).toBe(search!.x);await expect(page.locator('th').first()).toHaveText('');await expect(page.getByLabel('Select all visible tasks',{exact:true})).toBeVisible();page.once('dialog',dialog=>dialog.accept());await bulk.click();await expect(bulk).toHaveCount(0);await expect(page.getByLabel('Select TASK-001',{exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByLabel('Select TASK-001',{exact:true})).toBeVisible();
 expect(await page.locator('summary:has(.scope-pill)').first().evaluate(e=>getComputedStyle(e).borderTopWidth)).toBe('0px');
 await page.locator('nav').getByRole('button',{name:'Milestones',exact:true}).click();expect(await page.locator('summary:has(.scope-pill)').first().evaluate(e=>getComputedStyle(e).borderTopWidth)).toBe('0px');expect(await page.locator('tbody tr:has(.scope-pill) td').evaluateAll(cells=>cells.every(e=>getComputedStyle(e).verticalAlign==='middle'))).toBe(true);
 await page.locator('nav').getByRole('button',{name:'People',exact:true}).click();const notes=page.getByLabel('Notes for PERSON-001',{exact:true});await notes.evaluate(e=>(e as HTMLElement).style.height='160px');const row=notes.locator('..').locator('..'),del=row.getByRole('button',{name:'Delete',exact:true});expect((await notes.boundingBox())!.x+(await notes.boundingBox())!.width).toBeLessThan((await del.boundingBox())!.x);expect(await row.locator('td').evaluateAll(cells=>cells.every(e=>getComputedStyle(e).verticalAlign==='middle'))).toBe(true);
 for(const name of ['Risk Log','Decision Log']){await page.locator('nav').getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'Context',exact:true}).first().click();const editor=page.locator(name==='Risk Log'?'.risk-context-editor':'.decision-context-editor'),textarea=editor.locator('textarea');expect((await textarea.boundingBox())!.width).toBeGreaterThan((await editor.boundingBox())!.width*.85);await editor.locator('.relationship-picker summary').first().click();await expect(page.locator('.relationship-options:popover-open')).toBeVisible();await page.keyboard.press('Escape');await editor.getByRole('button',{name:'Cancel',exact:true}).click();}
});

test('conditional scope and initial Risk action validation stays associated and focused',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await setup(page);await page.locator('nav').getByRole('button',{name:'Milestones',exact:true}).click();await page.getByRole('button',{name:'Add Milestone',exact:true}).click();const milestone=page.getByRole('dialog',{name:'Create Milestone',exact:true});await milestone.getByLabel('Name',{exact:true}).fill('Gate');await milestone.getByLabel('Date',{exact:true}).fill('2028-02-29');await milestone.getByLabel('Project-wide',{exact:true}).uncheck();await milestone.getByRole('button',{name:'Create',exact:true}).click();const scope=milestone.locator('summary').filter({hasText:/^Streams ·/});await expect(scope).toBeFocused();await expect(scope).toHaveAttribute('aria-invalid','true');await milestone.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.locator('nav').getByRole('button',{name:'Risk Log',exact:true}).click();await page.getByRole('button',{name:'Add Risk',exact:true}).click();const risk=page.getByRole('dialog',{name:'Create Risk',exact:true});await risk.getByLabel('Risk title',{exact:true}).fill('Risk');await risk.getByRole('button',{name:'Add action',exact:true}).click();const action=risk.getByLabel('Action description 1',{exact:true}),before=await action.boundingBox();await risk.getByRole('button',{name:'Create',exact:true}).click();await expect(action).toBeFocused();await expect(action).toHaveAttribute('aria-invalid','true');expect(await action.boundingBox()).toEqual(before);await risk.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('button',{name:'Save Now',exact:true})).toBeDisabled();
});

for(const [width,height] of [[560,600],[900,600],[1024,768],[1366,768]] as const)test(`all creation forms fit ${width} by ${height} without validation displacement`,async({page})=>{
 await page.setViewportSize({width,height});await setup(page);
 for(const [moduleName,entity,,label] of cases){
  await page.locator('nav').getByRole('button',{name:moduleName,exact:true}).click();
  await page.getByRole('button',{name:`Add ${entity}`,exact:true}).click();
  const panel=page.getByRole('dialog',{name:`Create ${entity}`,exact:true}),fields=panel.locator('.creation-fields');
  const header=panel.locator(':scope>header'),footer=panel.locator('.creation-footer');
  const initialHeader=await header.boundingBox(),initialFooter=await footer.boundingBox();
  const assertFit=async()=>{
   const geometry=await fields.evaluate(element=>{
    const box=element.getBoundingClientRect();
    return {clientHeight:element.clientHeight,scrollHeight:element.scrollHeight,clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,box:{top:box.top,bottom:box.bottom,left:box.left,right:box.right},controls:[...element.querySelectorAll('input,select,textarea,summary,button')].filter(control=>!control.closest('.multi-select-options,.relationship-options')&&control.getClientRects().length>0).map(control=>{const rect=control.getBoundingClientRect();return {name:control.getAttribute('aria-label')||control.textContent||control.tagName,top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right};})};
   });
   expect(geometry.scrollHeight,`${entity} fields fit vertically`).toBeLessThanOrEqual(geometry.clientHeight+1);
   expect(geometry.scrollWidth,`${entity} fields fit horizontally`).toBeLessThanOrEqual(geometry.clientWidth+1);
   const columns=await fields.evaluate(element=>getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/));
   expect(columns,`${entity} desktop creation retains two columns`).toHaveLength(2);
   const singleLine=await fields.locator('input:not([type=checkbox]):not([type=radio]),select,summary').evaluateAll(elements=>elements.filter(element=>!element.closest('.multi-select-options,.relationship-options')&&element.getClientRects().length>0).map(element=>({name:element.getAttribute('aria-label')||element.textContent||element.tagName,height:element.getBoundingClientRect().height})));
   for(const control of singleLine)expect(control.height,`${entity}: ${control.name} compact height`).toBe(30);
   for(const control of geometry.controls){
    expect(control.top,`${entity}: ${control.name} top`).toBeGreaterThanOrEqual(geometry.box.top-1);
    expect(control.bottom,`${entity}: ${control.name} bottom`).toBeLessThanOrEqual(geometry.box.bottom+1);
    expect(control.left,`${entity}: ${control.name} left`).toBeGreaterThanOrEqual(geometry.box.left-1);
    expect(control.right,`${entity}: ${control.name} right`).toBeLessThanOrEqual(geometry.box.right+1);
   }
   for(const box of [await header.boundingBox(),await footer.boundingBox()]){
    expect(box).not.toBeNull();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(height+1);
   }
   for(const action of ['Cancel','Create']){
    const box=await footer.getByRole('button',{name:action,exact:true}).boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(height+1);
   }
   const fonts=await fields.locator('.creation-field,input:not([type=checkbox]):not([type=radio]),select,textarea').evaluateAll(elements=>elements.filter(element=>!element.closest('.multi-select-options,.relationship-options')).map(element=>getComputedStyle(element).fontSize));
   expect(new Set(fonts),`${entity} existing label/control typography`).toEqual(new Set(['13px']));
  };
  await assertFit();
  await panel.getByRole('button',{name:'Create',exact:true}).click();
  await expect(panel.getByLabel(label,{exact:true})).toBeFocused();
  await expect(panel.getByLabel(label,{exact:true})).toHaveAttribute('aria-invalid','true');
  await assertFit();
  expect(await header.boundingBox()).toEqual(initialHeader);expect(await footer.boundingBox()).toEqual(initialFooter);
  if(entity==='Risk'&&height===768){
   await panel.getByRole('button',{name:'Add action',exact:true}).click();
   const description=panel.getByLabel('Action description 1',{exact:true});
   await description.scrollIntoViewIfNeeded();await expect(description).toBeVisible();
   await description.fill('A compact mitigation');
   await panel.getByLabel('Action status 1',{exact:true}).selectOption('Complete');
   await panel.getByLabel('Action due date 1',{exact:true}).fill('2028-03-02');
   expect(await fields.evaluate(element=>element.scrollHeight<=element.clientHeight+1),'Risk with one initial action fits vertically').toBe(true);
   const remove=panel.getByRole('button',{name:'Remove action',exact:true}),add=panel.getByRole('button',{name:'Add action',exact:true});
   expect((await add.boundingBox())!.y).toBeGreaterThanOrEqual((await remove.boundingBox())!.y);
   await remove.focus();await remove.press('Tab');await expect(add).toBeFocused();
   expect(await header.boundingBox()).toEqual(initialHeader);expect(await footer.boundingBox()).toEqual(initialFooter);
   const owner=panel.locator('summary[aria-label="Owner"]');await owner.scrollIntoViewIfNeeded();await owner.click();
   const options=page.locator('.multi-select-options:popover-open');await expect(options).toBeVisible();
   const popup=await options.boundingBox();expect(popup!.y).toBeGreaterThanOrEqual(0);expect(popup!.y+popup!.height).toBeLessThanOrEqual(height+1);
   await page.keyboard.press('Escape');await expect(owner).toBeFocused();
   expect(await footer.boundingBox()).toEqual(initialFooter);
  }
  await panel.getByRole('button',{name:'Cancel',exact:true}).click();
 }
});

test('narrow creation keeps scrolling inside the fields and footer actions in view',async({page})=>{
 const width=375,height=600;await page.setViewportSize({width,height});await setup(page);
 await page.locator('nav').getByRole('button',{name:'Risk Log',exact:true}).click();
 await page.getByRole('button',{name:'Add Risk',exact:true}).click();
 const panel=page.getByRole('dialog',{name:'Create Risk',exact:true}),fields=panel.locator('.creation-fields'),footer=panel.locator('.creation-footer');
 const footerBefore=await footer.boundingBox();
 const scroll=await fields.evaluate(element=>({height:element.clientHeight,total:element.scrollHeight,width:element.clientWidth,totalWidth:element.scrollWidth}));
 expect(scroll.total).toBeGreaterThan(scroll.height);expect(scroll.totalWidth).toBeLessThanOrEqual(scroll.width+1);
 await fields.evaluate(element=>{element.scrollTop=element.scrollHeight;});
 expect(await fields.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
 expect(await footer.boundingBox()).toEqual(footerBefore);
 for(const action of ['Cancel','Create']){
  const box=await footer.getByRole('button',{name:action,exact:true}).boundingBox();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(height+1);expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width+1);
 }
});


test('expanded Risk action lists keep header and submit actions fixed',async({page})=>{
 await page.setViewportSize({width:900,height:600});await setup(page);
 await page.locator('nav').getByRole('button',{name:'Risk Log',exact:true}).click();
 await page.getByRole('button',{name:'Add Risk',exact:true}).click();
 const panel=page.getByRole('dialog',{name:'Create Risk',exact:true}),fields=panel.locator('.creation-fields'),header=panel.locator(':scope>header'),footer=panel.locator('.creation-footer');
 const originalHeader=await header.boundingBox(),originalFooter=await footer.boundingBox();
 for(let index=0;index<6;index++)await panel.getByRole('button',{name:'Add action',exact:true}).click();
 const last=panel.getByLabel('Action description 6',{exact:true});await last.fill('Last mitigation remains reachable');
 expect(await fields.evaluate(element=>element.scrollHeight>element.clientHeight)).toBe(true);
 expect(await fields.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
 expect(await header.boundingBox()).toEqual(originalHeader);expect(await footer.boundingBox()).toEqual(originalFooter);
 await expect(last).toBeVisible();
 for(const name of ['Cancel','Create']){const box=await footer.getByRole('button',{name,exact:true}).boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(601);}
 await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(panel).toBeHidden();
});
