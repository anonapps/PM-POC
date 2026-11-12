import type { Page } from '@playwright/test';
export async function openProjectDetails(page:Page){await page.locator('nav').getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Edit Project Details',exact:true}).click();}
