import type { Page } from '@playwright/test';
async function openFilters(page:Page,moduleName:'Gantt'|'Tube Map') {
 const chart=page.locator(moduleName==='Gantt'?'.gantt-panel':'.workspace.module-tube-map > .panel');
 await chart.locator('.filter-trigger').click();
 return page.locator('.filter-popover');
}
export async function setTimelineFilter(page:Page,label:string,checked:boolean,moduleName:'Gantt'|'Tube Map'='Gantt') {
 const filters=await openFilters(page,moduleName);
 await filters.getByRole('checkbox',{name:label,exact:true}).setChecked(checked);
 await page.keyboard.press('Escape');
}
export async function timelineFilterChecked(page:Page,label:string,moduleName:'Gantt'|'Tube Map'='Gantt') {
 const filters=await openFilters(page,moduleName);
 const checked=await filters.getByRole('checkbox',{name:label,exact:true}).isChecked();
 await page.keyboard.press('Escape');return checked;
}
