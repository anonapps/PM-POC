import type {Page} from '@playwright/test';
/** Existing final-geometry assertions must wait for the newly approved finite transition. */
export async function settleSidebar(page:Page){await page.locator('.app-shell').evaluate(async root=>{root.getBoundingClientRect();await Promise.all(root.getAnimations({subtree:true}).filter(animation=>animation instanceof CSSTransition).map(animation=>animation.finished.catch(()=>{})));});}
