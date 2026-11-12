import { type Page } from '@playwright/test';
export async function tubeFilter(page:Page,label:string,checked:boolean) {
  await page.locator('.filter-trigger').click();
  await page.getByRole('checkbox',{name:label,exact:true}).setChecked(checked);
  await page.keyboard.press('Escape');
}
export async function tubeNames(page:Page,visible:boolean) {
  await tubeFilter(page,'Hide Milestones Names',!visible);
}
