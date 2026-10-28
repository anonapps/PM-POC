import { test, expect } from '@playwright/test';

test('compatibility geometry at supported review widths',async({page})=>{
  for(const width of [900,1440,1920]){
    await page.setViewportSize({width,height:1000});
    await page.goto('/');
    await expect(page.getByRole('heading',{name:'ARGOS PM UI catalogue'})).toBeVisible();
    for(const [label,height] of [['Regular name',36],['Creation name',34],['Embedded name',30]] as const){
      await expect(page.getByRole('textbox',{name:label,exact:true})).toHaveCSS('height',`${height}px`);
    }
    const footers=page.locator('#footers footer.timeline-navigation');
    await expect(footers).toHaveCount(2);
    const heights=await footers.evaluateAll(elements=>elements.map(element=>element.getBoundingClientRect().height));
    expect(heights[0]).toBe(heights[1]);
    if(width>=1440)expect(heights[0]).toBe(56);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});

test('real selector filtering, keyboard dismissal and local-only text editing',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Regular name',{exact:true}).fill('lowercase example');
  await page.getByLabel('Creation name',{exact:true}).focus();
  await expect(page.getByLabel('Regular name',{exact:true})).toHaveValue('Lowercase example');
  await page.getByLabel('Catalogue owner',{exact:true}).click();
  const search=page.getByRole('searchbox',{name:'Search Catalogue owner',exact:true});
  await search.fill('Marta');
  await expect(page.getByRole('radio',{name:/Marta/})).toBeVisible();
  await search.press('Enter');
  await expect(page.getByLabel('Catalogue owner',{exact:true})).toContainText('Marta');
  await page.getByLabel('Catalogue owner',{exact:true}).click();
  await search.fill('No such person');
  await expect(page.getByText('No matching options',{exact:true})).toBeVisible();
  await search.press('Escape');
  await expect(page.getByLabel('Catalogue owner',{exact:true})).toBeFocused();
  await expect(search).toBeHidden();
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
});

test('single dependency pin, hide and clear use the actual shared assets',async({page})=>{
  await page.goto('/');
  const lines=page.locator('#relationships .dependency-connection');
  await lines.nth(0).focus();
  await lines.nth(0).press('Enter');
  await expect(page.locator('#relationships .dependency-connection[aria-pressed=true]')).toHaveCount(1);
  await expect(page.locator('.catalogue-node[data-muted=true]')).toHaveCount(1);
  await lines.nth(1).focus();
  await lines.nth(1).press('Space');
  await expect(lines.nth(0)).toHaveAttribute('aria-pressed','false');
  await expect(lines.nth(1)).toHaveAttribute('aria-pressed','true');
  await lines.nth(1).press('Escape');
  await expect(page.locator('#relationships .dependency-connection[data-active=true]')).toHaveCount(0);
  await page.getByRole('button',{name:'Search and filter catalogue',exact:true}).click();
  await page.getByRole('checkbox',{name:'Hide dependencies',exact:true}).check();
  await expect(lines).toHaveCount(0);
  await page.getByRole('button',{name:'Clear all',exact:true}).click();
  await expect(lines).toHaveCount(2);
});

test('real creation panel validation and identical entry points stay disposable',async({page})=>{
  await page.addInitScript(()=>{
    const calls:string[]=[];
    Object.assign(window,{catalogueFileCalls:calls,showOpenFilePicker:()=>{calls.push('open');throw new Error('Catalogue must not open files');},showSaveFilePicker:()=>{calls.push('save');throw new Error('Catalogue must not save files');}});
  });
  await page.goto('/');
  const heights:number[]=[];
  for(const name of ['Standalone Add Task','Extended Add Task']){
    await page.getByRole('button',{name,exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Create Task',exact:true});
    await expect(dialog).toBeVisible();
    heights.push((await dialog.boundingBox())!.height);
    await dialog.getByRole('button',{name:'Create',exact:true}).click();
    await expect(dialog.getByRole('textbox',{name:'Task name',exact:true})).toHaveAttribute('aria-invalid','true');
    await dialog.getByRole('textbox',{name:'Task name',exact:true}).fill('Disposable task');
    await dialog.getByRole('button',{name:'Close Create Task',exact:true}).click();
    const discard=page.getByRole('dialog',{name:'Discard unsaved changes?',exact:true});
    await expect(discard).toBeVisible();
    await discard.getByRole('button',{name:'Discard',exact:true}).click();
    await expect(dialog).toBeHidden();
  }
  expect(heights[0]).toBe(heights[1]);
  await page.getByRole('button',{name:'Open dialog',exact:true}).click();
  await page.getByRole('dialog',{name:'Example dialog',exact:true}).press('Escape');
  await expect(page.getByRole('button',{name:'Open dialog',exact:true})).toBeFocused();
  expect(await page.evaluate(()=>Reflect.get(window,'catalogueFileCalls'))).toEqual([]);
});

test('footer examples retain model navigation increments and zoom reset',async({page})=>{
  await page.goto('/');
  for(const [name,days] of [['task example navigation',1],['milestone example navigation',28]] as const){
    const nav=page.getByRole('navigation',{name,exact:true});
    const range=nav.locator('[data-start]');
    const start=await range.getAttribute('data-start');
    const end=await range.getAttribute('data-end');
    await nav.getByRole('button',{name:'Next',exact:true}).click();
    await expect(range).toHaveAttribute('data-start',new Date(Date.parse(start!)+days*86400000).toISOString().slice(0,10));
    await expect(range).toHaveAttribute('data-end',new Date(Date.parse(end!)+days*86400000).toISOString().slice(0,10));
    await nav.getByRole('button',{name:'Jump to today',exact:true}).click();
    await expect(range).toHaveAttribute('data-start',start!);
  }
  const nav=page.getByRole('navigation',{name:'task example navigation',exact:true});
  await page.getByLabel('Example zoom',{exact:true}).selectOption('Month');
  await expect(nav.locator('[data-start]')).toHaveAttribute('data-start','2026-10-12');
  const start=await nav.locator('[data-start]').getAttribute('data-start');
  await nav.getByRole('button',{name:'Next',exact:true}).click();
  await expect(nav.locator('[data-start]')).toHaveAttribute('data-start',new Date(Date.parse(start!)+7*86400000).toISOString().slice(0,10));
});

test('core color reference resolves production aliases and generated swatches',async({page})=>{
  await page.goto('/');
  const values={canvas:'#f4f6f8',surface:'#ffffff','surface-subtle':'#edf1f5',text:'#0f172a','text-muted':'#526174',border:'#dce2e9','control-border':'#8293a8',primary:'#164a91','primary-hover':'#123e7a','primary-active':'#0e3263',sidebar:'#17243a',focus:'#1b65c9'};
  expect(await page.evaluate(names=>{
    const style=getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map(name=>[name,style.getPropertyValue(`--${name}`).trim()]));
  },Object.keys(values))).toEqual(values);
  const swatches=page.getByTestId('core-color-tokens').locator('.catalogue-swatch');
  await expect(swatches).toHaveCount(12);
  const colors=Object.values(values).map(hex=>`rgb(${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)})`);
  expect(await swatches.evaluateAll(elements=>elements.map(el=>getComputedStyle(el).backgroundColor))).toEqual(colors);
});
