import { test, expect } from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    const calls:string[]=[];
    Object.assign(window,{catalogueFileCalls:calls,showOpenFilePicker:()=>{calls.push('open');throw new Error('Unexpected file access');},showSaveFilePicker:()=>{calls.push('save');throw new Error('Unexpected file access');}});
  });
  await page.goto('/');
});
test.afterEach(async({page})=>{
  expect(await page.evaluate(()=>Reflect.get(window,'catalogueFileCalls'))).toEqual([]);
});

test('all six real creation forms validate, create only in memory and reset',async({page})=>{
  const examples=page.getByRole('region',{name:'Creation examples',exact:true});
  const names={Person:'Person name',Stream:'Stream name',Task:'Task name',Milestone:'Name',Risk:'Risk title',Decision:'Title'};
  for(const [kind,label] of Object.entries(names)){
    await examples.getByRole('button',{name:`Create example ${kind}`,exact:true}).click();
    const dialog=page.getByRole('dialog',{name:`Create ${kind}`,exact:true});
    await dialog.getByRole('button',{name:'Create',exact:true}).click();
    await expect(dialog.getByRole('textbox',{name:label,exact:true})).toHaveAttribute('aria-invalid','true');
    await dialog.getByRole('textbox',{name:label,exact:true}).fill(`Disposable ${kind}`);
    if(kind==='Milestone')await dialog.getByLabel('Date',{exact:true}).fill('2026-10-28');
    if(kind==='Decision')await dialog.getByLabel('Decision date',{exact:true}).fill('2026-10-28');
    await dialog.getByRole('button',{name:'Create',exact:true}).click();
    await expect(dialog).toBeHidden();
    await examples.getByRole('button',{name:'Reset creation examples',exact:true}).click();
  }
});

test('real Tasks table sorts, selects with indeterminate header and resets edits',async({page})=>{
  const content=page.getByTestId('record-example-content');
  const selectAll=content.getByRole('checkbox',{name:'Select all visible tasks',exact:true});
  const rows=content.getByRole('checkbox',{name:/^Select TASK-/});
  await rows.first().check();
  await expect(selectAll).toHaveJSProperty('indeterminate',true);
  await selectAll.check();
  await expect(selectAll).toBeChecked();
  await expect(selectAll).toHaveJSProperty('indeterminate',false);
  await selectAll.uncheck();
  const name=content.getByRole('textbox',{name:/^Name for TASK-/}).first();
  const label=await name.getAttribute('aria-label');
  const original=await name.inputValue();
  await name.fill('Changed only in catalogue');
  await selectAll.focus();
  await expect(name).toHaveValue('Changed only in catalogue');
  await content.getByRole('button',{name:'Task',exact:true}).click();
  await expect(content.getByRole('button',{name:'Task ↑',exact:true})).toBeVisible();
  await content.getByRole('button',{name:'Task ↑',exact:true}).click();
  await expect(content.getByRole('button',{name:'Task ↓',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Reset record examples',exact:true}).click();
  await expect(content.getByRole('textbox',{name:label!,exact:true})).toHaveValue(original);
});

test('Risk and Decision context editors retain real compact choices and actions',async({page})=>{
  const examples=page.getByRole('region',{name:'Record page examples',exact:true});
  const content=page.getByTestId('record-example-content');
  await examples.getByRole('button',{name:'Risk Log',exact:true}).click();
  await content.getByRole('button',{name:'Context',exact:true}).first().click();
  const risk=content.locator('.risk-context-editor');
  await expect(risk).toBeVisible();
  await expect(risk.locator('summary').first()).toHaveCSS('height','30px');
  await risk.getByRole('button',{name:'Cancel',exact:true}).click();
  await content.getByRole('button',{name:/^Actions \(/}).first().click();
  await expect(content.locator('.risk-actions-editor')).toBeVisible();
  await examples.getByRole('button',{name:'Decision Log',exact:true}).click();
  await content.getByRole('button',{name:'Context',exact:true}).first().click();
  const decision=content.locator('.decision-context-editor');
  await expect(decision).toBeVisible();
  await expect(decision.locator('.decision-context-column')).toHaveCount(4);
  await decision.getByRole('checkbox',{name:'Project-wide (exclusive)',exact:true}).check();
  await expect(decision.locator('.decision-context-column')).toHaveCount(2);
  await decision.getByRole('button',{name:'Cancel',exact:true}).click();
});

test('Baselines exposes real menu, manager and nine sortable column headers',async({page})=>{
  const examples=page.getByRole('region',{name:'Record page examples',exact:true});
  const content=page.getByTestId('record-example-content');
  await examples.getByRole('button',{name:'Baselines',exact:true}).click();
  const headers=content.locator('table thead th');
  await expect(headers).toHaveCount(9);
  for(let index=0;index<9;index++){
    await headers.nth(index).getByRole('button').click();
    await expect(headers.nth(index)).toHaveAttribute('aria-sort','ascending');
    await headers.nth(index).getByRole('button').click();
    await expect(headers.nth(index)).toHaveAttribute('aria-sort','descending');
  }
  await content.getByLabel('Baseline actions',{exact:true}).click();
  await page.getByRole('button',{name:'Manage baselines',exact:true}).click();
  const manager=page.getByRole('dialog',{name:'Manage baselines',exact:true});
  await expect(manager).toBeVisible();
  await manager.getByRole('button',{name:'Done',exact:true}).click();
  await expect(content.getByLabel('Baseline actions',{exact:true})).toBeFocused();
});

test('reference assets retain native titles and keyboard warning dismissal',async({page})=>{
  const references=page.locator('#references');
  await expect(references.getByRole('button',{name:'Hover for full text',exact:true})).toHaveAttribute('title','Full example text retained for a clipped value');
  await references.getByLabel('Example dependency warnings',{exact:true}).click();
  await expect(references.getByText('Example dependency dates are not scheduled.',{exact:true})).toBeVisible();
  await references.getByLabel('Example dependency warnings',{exact:true}).press('Escape');
  await expect(references.getByText('Example dependency dates are not scheduled.',{exact:true})).toBeHidden();
  await expect(references.getByLabel('Example dependency warnings',{exact:true})).toBeFocused();
  await expect(references.getByLabel('Today',{exact:true})).toHaveCount(1);
});

test('log actions retain context hotkeys, native submission and action undo',async({page})=>{
  const examples=page.getByRole('region',{name:'Record page examples',exact:true});
  const content=page.getByTestId('record-example-content');
  await examples.getByRole('button',{name:'Risk Log',exact:true}).click();
  await content.getByRole('button',{name:'Context',exact:true}).first().click();
  const risk=content.locator('.risk-context-editor');
  await risk.getByRole('textbox',{name:'Description',exact:true}).fill('Updated risk context');
  await risk.getByRole('textbox',{name:'Description',exact:true}).press('Control+Enter');
  await expect(risk).toBeHidden();
  await content.getByRole('button',{name:'Context',exact:true}).first().click();
  await expect(risk.getByRole('textbox',{name:'Description',exact:true})).toHaveValue('Updated risk context');
  await risk.getByRole('button',{name:'Cancel',exact:true}).click();
  await content.getByRole('button',{name:/^Actions \(/}).first().click();
  const actions=content.locator('.risk-actions-editor');
  await actions.getByLabel('New action description',{exact:true}).fill('Added with native Enter');
  await actions.getByLabel('New action description',{exact:true}).press('Enter');
  await expect(actions.locator('.risk-action-row')).toHaveCount(3);
  await actions.locator('.risk-action-row').last().getByRole('button',{name:'Delete',exact:true}).click();
  await expect(actions.locator('.risk-action-row')).toHaveCount(2);
  await actions.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(actions.locator('.risk-action-row')).toHaveCount(3);
  await examples.getByRole('button',{name:'Decision Log',exact:true}).click();
  await content.getByRole('button',{name:'Context',exact:true}).first().click();
  const decision=content.locator('.decision-context-editor');
  await decision.getByRole('textbox',{name:'Additional information',exact:true}).fill('Updated decision context');
  await decision.getByRole('textbox',{name:'Additional information',exact:true}).press('Control+Enter');
  await expect(decision).toBeHidden();
  await content.getByRole('button',{name:'Context',exact:true}).first().click();
  await expect(decision.getByRole('textbox',{name:'Additional information',exact:true})).toHaveValue('Updated decision context');
});

test('Dependencies examples preserve filter labels, editor actions and footer paint values',async({page})=>{
  const examples=page.getByRole('region',{name:'Record page examples',exact:true});
  const content=page.getByTestId('record-example-content');
  await examples.getByRole('button',{name:'Dependencies',exact:true}).click();
  await examples.evaluate(element=>element.scrollIntoView({block:'start'}));
  await expect.poll(()=>content.locator('.dependencies-panel').evaluate(element=>element.getBoundingClientRect().height)).toBeGreaterThan(200);
  const footer=content.getByRole('contentinfo',{name:'Dependency information',exact:true});
  await expect(footer).toHaveCSS('position','static');
  await expect(footer).toHaveCSS('bottom','0px');
  await expect(footer).toHaveCSS('z-index','16');
  await content.getByRole('button',{name:'Search and filter dependencies',exact:true}).click();
  const filters=page.getByRole('region',{name:'Search and filter controls for dependencies',exact:true});
  await filters.getByText('Cross-stream only',{exact:true}).click();
  await expect(filters.getByRole('checkbox',{name:'Cross-stream only',exact:true})).toBeChecked();
  await filters.getByText('Warnings only',{exact:true}).click();
  await expect(filters.getByRole('checkbox',{name:'Warnings only',exact:true})).toBeChecked();
  await filters.getByRole('button',{name:'Clear all',exact:true}).click();
  await expect(filters.getByRole('checkbox',{name:'Cross-stream only',exact:true})).not.toBeChecked();
  await expect(filters.getByRole('checkbox',{name:'Warnings only',exact:true})).not.toBeChecked();
  await page.keyboard.press('Escape');
  await content.getByRole('button',{name:'Edit dependency dependency-1',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Edit dependency',exact:true});
  await expect(dialog.getByRole('button',{name:'Save dependency',exact:true})).toBeEnabled();
  await dialog.getByLabel('Dependency successor',{exact:true}).click();
  await page.getByRole('radio',{name:'TASK-001 · Prepare launch',exact:true}).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Save dependency',exact:true})).toBeDisabled();
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(dialog).toBeHidden();
  await content.getByRole('button',{name:'Edit dependency dependency-1',exact:true}).click();
  await dialog.getByRole('button',{name:'Save dependency',exact:true}).click();
  await expect(dialog).toBeHidden();
});
