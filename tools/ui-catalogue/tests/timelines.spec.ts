import { test, expect } from '@playwright/test';

test('full chart examples retain baselines, exclusive focus, hide/reset and Extended mode',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install({time:new Date('2026-10-27T12:00:00Z')});
  await page.goto('/');
  const examples=page.getByRole('region',{name:'Timeline page examples',exact:true});
  const content=page.getByTestId('timeline-example-content');
  await examples.scrollIntoViewIfNeeded();
  await content.getByRole('checkbox',{name:'Baseline overlay',exact:true}).check();
  await expect(content.locator('.gantt-baseline').first()).toBeVisible();
  const links=content.locator('.dependency-connection');
  await expect(links).toHaveCount(2);
  await links.first().focus();
  await links.first().press('Enter');
  await expect(content.locator('.dependency-connection[aria-pressed=true]')).toHaveCount(1);
  await expect(content.locator('.gantt-row.dependency-muted').first()).toBeVisible();
  await content.getByRole('button',{name:'Search and filter gantt',exact:true}).click();
  await page.getByRole('region',{name:'Search and filter controls for gantt',exact:true}).getByRole('checkbox',{name:'Hide dependencies',exact:true}).check();
  await expect(links).toHaveCount(0);
  await page.getByRole('button',{name:'Clear all',exact:true}).click();
  await expect(links).toHaveCount(2);
  await page.keyboard.press('Escape');
  await content.getByRole('button',{name:'Extended',exact:true}).click();
  await expect(content.locator('.gantt-tasks-pane table.tasks-table')).toBeVisible();
  await expect(content.getByRole('separator')).toHaveCount(1);
  await content.getByRole('button',{name:'Add Task',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Create Task',exact:true})).toBeVisible();
  await page.getByRole('dialog',{name:'Create Task',exact:true}).getByRole('button',{name:'Cancel',exact:true}).click();
  await examples.getByRole('button',{name:'Tube Map chart',exact:true}).click();
  await expect(content.getByRole('navigation',{name:'Tube Map date navigation',exact:true})).toBeVisible();
  await content.getByRole('checkbox',{name:'Baseline milestones',exact:true}).check();
  await expect(content.locator('.dependency-connection')).toHaveCount(2);
  await content.getByRole('button',{name:'Search and filter tube map',exact:true}).click();
  const filter=page.getByRole('region',{name:'Search and filter controls for tube map',exact:true});
  await filter.getByRole('checkbox',{name:'Hide dependencies',exact:true}).check();
  await expect(content.locator('.dependency-connection')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await examples.getByRole('button',{name:'Reset timeline examples',exact:true}).click();
  await expect(content.locator('.dependency-connection')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('timeline quick actions preserve submit, cancel and record navigation',async({page})=>{
  await page.clock.install({time:new Date('2026-10-27T12:00:00Z')});
  await page.goto('/');
  const examples=page.getByRole('region',{name:'Timeline page examples',exact:true});
  const content=page.getByTestId('timeline-example-content');
  await examples.scrollIntoViewIfNeeded();
  for(const kind of ['task','milestone'] as const){
    if(kind==='milestone')await examples.getByRole('button',{name:'Tube Map chart',exact:true}).click();
    const original=kind==='task'?'Prepare launch':'Launch approval';
    const trigger=(name:string)=>content.getByRole('button',{name:kind==='task'?name:`Edit milestone ${name}`,exact:true});
    const form=content.getByRole('form',{name:`Quick edit ${kind}`,exact:true});
    await trigger(original).click();
    await expect(form.getByRole('button',{name:'Save',exact:true})).toHaveAttribute('type','submit');
    for(const label of ['Cancel',kind==='task'?'Open Task':'Open Milestone']){
      await expect(form.getByRole('button',{name:label,exact:true})).toHaveAttribute('type','button');
      await expect(form.getByRole('button',{name:label,exact:true})).toHaveClass('secondary');
    }
    await form.getByLabel(kind==='task'?'Task name':'Milestone name',{exact:true}).fill('Discard this edit');
    await form.getByRole('button',{name:'Cancel',exact:true}).click();
    await expect(form).toHaveCount(0);
    await trigger(original).click();
    await expect(form.getByLabel(kind==='task'?'Task name':'Milestone name',{exact:true})).toHaveValue(original);
    await form.getByLabel(kind==='task'?'Task name':'Milestone name',{exact:true}).fill(`${original} updated`);
    await form.getByRole('button',{name:'Save',exact:true}).click();
    await expect(form).toHaveCount(0);
    await trigger(`${original} updated`).click();
    await form.getByRole('button',{name:kind==='task'?'Open Task':'Open Milestone',exact:true}).click();
    await expect(form).toHaveCount(0);
    await expect(examples.getByRole('status')).toContainText(kind==='task'?'Tasks':'Milestones');
  }
});
