import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const bytes=[...readFileSync('src/testing/fixtures/regression-180.pmp')];
test.use({timezoneId:'Europe/Madrid'});
for(const scenario of [
 {name:'Monday',instant:'2026-11-09T12:00:00Z',today:'2026-11-09',start:'2026-10-12',end:'2027-01-03'},
 {name:'local New Year',instant:'2026-12-31T23:30:00Z',today:'2027-01-01',start:'2026-11-30',end:'2027-02-21'},
 {name:'daylight-saving Sunday',instant:'2026-03-29T01:30:00Z',today:'2026-03-29',start:'2026-02-23',end:'2026-05-17'},
])test(`Tube Map opens and jumps to four historical/eight upcoming weeks on ${scenario.name}`,async({page},info)=>{
 await page.setViewportSize({width:1440,height:900});await page.clock.setFixedTime(new Date(scenario.instant));
 await page.addInitScript(({bytes})=>{const data=new Uint8Array(bytes),handle={name:'today-window.pmp',async getFile(){return{name:this.name,size:data.length,lastModified:1,arrayBuffer:async()=>data.slice().buffer}}};Object.assign(window,{showOpenFilePicker:async()=>[handle]})},{bytes});
 await page.goto('/');await page.getByRole('button',{name:'Open Project',exact:true}).click();const nav=(name:string)=>page.locator('nav').getByRole('button',{name,exact:true}).click();await nav('Tube Map');
 const footer=page.getByRole('navigation',{name:'Tube Map date navigation'}),range=footer.locator('span[data-start]'),jump=footer.getByRole('button',{name:'Jump to today',exact:true});
 const todayFraction=(Date.parse(scenario.today)-Date.parse(scenario.start))/(84*86400000);
 const check=async()=>{
  await expect(range).toHaveAttribute('data-start',scenario.start);await expect(range).toHaveAttribute('data-end',scenario.end);await expect(jump).toBeDisabled();
  const body=(await page.locator('.tube-body').boundingBox())!,marker=page.locator('.tube-body>.timeline-today-marker');await expect(marker).toBeVisible();await expect(marker).toHaveAttribute('aria-label',`Today ${scenario.today.split('-').reverse().join('/')}`);
  expect(((await marker.boundingBox())!.x-body.x)/body.width).toBeCloseTo(todayFraction,2);
  expect(todayFraction).toBeGreaterThanOrEqual(1/3);expect(todayFraction).toBeLessThan(5/12);
  await expect(page.getByRole('button',{name:'Save Now',exact:true,includeHidden:true})).toBeDisabled();
  await expect(page.locator('.tube-axis>span')).toHaveCount(12);expect((await page.locator('.tube-axis').boundingBox())!.height).toBe(24);
 };
 await check();await page.getByRole('combobox',{name:/^Axis/}).selectOption('date');await expect(page.locator('.tube-axis>span').nth(4)).toHaveText(scenario.today==='2027-01-01'?'28/12':scenario.today==='2026-03-29'?'23/03':'09/11');
 await footer.getByRole('button',{name:'Next 4 weeks',exact:true}).click();await expect(jump).toBeEnabled();expect(Date.parse((await range.getAttribute('data-start'))!)-Date.parse(scenario.start)).toBe(28*86400000);
 await jump.click();await check();await expect(page.getByRole('combobox',{name:/^Axis/})).toHaveValue('date');
 await footer.getByRole('button',{name:'Previous 4 weeks',exact:true}).click();expect(Date.parse(scenario.start)-Date.parse((await range.getAttribute('data-start'))!)).toBe(28*86400000);await jump.click();await check();
 await nav('People');await nav('Tube Map');await check();
 if(scenario.name==='Monday')await page.screenshot({path:info.outputPath('tube-map-today-one-third.png')});
});
