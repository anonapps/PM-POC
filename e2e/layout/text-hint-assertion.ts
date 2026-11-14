import {expect,type Page} from '@playwright/test';

/** Avoid a full-page ARIA failure snapshot while the delegated hint is pending. */
export async function expectTextHint(page:Page,text:string){
 const tooltip=page.locator('.title-tooltip');
 // Playwright's missing single-element assertion snapshots the entire Tasks page.
 // Its synchronous ARIA walk can block the 300ms hint timer past the 5s deadline.
 // Array reads return [] cheaply; require one matching hint within the same default
 // assertion deadline before retaining the original locator/text assertion.
 await expect.poll(()=>tooltip.allTextContents(),{message:`One text hint containing ${JSON.stringify(text)}`}).toEqual([expect.stringContaining(text)]);
 await expect(tooltip).toContainText(text);
}
