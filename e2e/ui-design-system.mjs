import { writeFile } from "node:fs/promises";
// Geometry and keyboard checks use the actual hydrated application.
export async function verifyDesignSystem({ cdp, evaluate, waitFor, click, nav, record }) {
  for (const width of [1440, 1080, 768, 375]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await nav('People');
    await waitFor(`(()=>{const t=document.querySelector('.panel>.title-row'),w=document.querySelector('.workspace');return !!t&&!!w&&Math.abs(parseFloat(getComputedStyle(w).getPropertyValue('--module-toolbar-height'))-t.getBoundingClientRect().height)<1})()`);
    record(`Measured toolbar offset at ${width}px`, await evaluate(`(()=>{const t=document.querySelector('.panel>.title-row'),h=document.querySelector('.panel>table th');return !h||Math.abs(parseFloat(getComputedStyle(h).top)-t.getBoundingClientRect().height)<1})()`));
    record(`Save status and navigation visible at ${width}px`, await evaluate(`(()=>{const s=document.querySelector('.save-state');return !!s&&getComputedStyle(s).display!=='none'&&[...document.querySelectorAll('nav button')].every(b=>b.querySelector('span')?.getBoundingClientRect().width>0&&b.getAttribute('aria-label'))})()`));
    await nav('Tube Map');
    await evaluate(`(()=>{const w=document.querySelector('.workspace');w.scrollTop=w.scrollHeight})()`);
    // Let sticky geometry settle across a paint, rather than asserting in the scroll mutation.
    await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
    record(`Tube Map axis remains below toolbar after scroll at ${width}px`, await evaluate(`(()=>{const a=document.querySelector('.tube-axis'),t=document.querySelector('.title-row'),w=document.querySelector('.workspace');if(!a||!t||!w)return false;const b=a.getBoundingClientRect();return Math.abs(parseFloat(getComputedStyle(a).top)-t.getBoundingClientRect().height)<1&&b.top>=t.getBoundingClientRect().bottom-2&&b.top<w.getBoundingClientRect().bottom&&a.querySelectorAll('span').length===12})()`));
  }
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.querySelector('[aria-label="Expand sidebar"]')?.click()`);
  record('Sidebar toggle is visibly available', await evaluate(`(()=>{const b=document.querySelector('button[aria-label="Collapse sidebar"]');return !!b&&getComputedStyle(b).visibility==='visible'&&b.getBoundingClientRect().height>=32})()`));
  for (const width of [1440, 768, 375]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await evaluate(`document.querySelector('[aria-label="Collapse sidebar"]')?.click()`);
    await waitFor(`Boolean(document.querySelector('[aria-label="Expand sidebar"]'))`);
    record(`Collapsed rail letters and header separation at ${width}px`, await evaluate(`(()=>{const a=document.querySelector('aside').getBoundingClientRect(),h=document.querySelector('.app-main>header').getBoundingClientRect();return a.width===64&&h.left>=a.right&&[...document.querySelectorAll('nav button')].every(b=>(b.getAttribute('aria-label')==='Overview'||b.getAttribute('aria-label')==='Search'?!!b.querySelector('.module-letter svg'):b.querySelector('.module-letter')?.textContent.trim()===b.getAttribute('aria-label').slice(0,1)))})()`));
    await nav('People');
    record(`Collapsed navigation works at ${width}px`, await evaluate(`document.querySelector('nav [aria-current="page"]').getAttribute('aria-label')==='People'`));
    await evaluate(`document.querySelector('[aria-label="Expand sidebar"]').click()`);
    await waitFor(`Boolean(document.querySelector('[aria-label="Collapse sidebar"]'))`);
    record(`Expanded labels restored at ${width}px`, await evaluate(`getComputedStyle(document.querySelector('.module-label')).display!=='none'`));
  }
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await nav('Overview');
  await evaluate(`document.querySelector('.workspace').scrollTop=0`);
  await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
  if (process.env.UI_SCREENSHOT_PATH) {
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(process.env.UI_SCREENSHOT_PATH, Buffer.from(screenshot.data, 'base64'));
  }
  await nav('Streams');
  await click('Add Stream');
  await evaluate(`(()=>{const input=document.getElementById('new-stream-name');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(input,'Fresh selection stream');input.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await evaluate(`document.querySelector('form[data-create-draft]').requestSubmit()`);
  await waitFor(`!document.querySelector('form[data-create-draft]')`);
  await nav('Milestones');
  record('New stream available in milestone scope after navigation', await evaluate(`[...document.querySelectorAll('.multi-select-options label')].some(l=>l.textContent.includes('Fresh selection stream'))`));
  await nav('Tube Map');
  const diamondExists = await evaluate(`Boolean(document.querySelector('.tube-station-diamond'))`);
  if (diamondExists) {
    await evaluate(`document.querySelector('.tube-station-diamond').click()`);
    record('Milestone diamond opens quick edit', await evaluate(`Boolean(document.querySelector('.tube-quick-edit input[type="date"]'))`));
    await evaluate(`document.querySelector('.tube-quick-edit button[type="submit"]')?.click()`);
    record('Unchanged milestone save closes quick edit', await evaluate(`!document.querySelector('.tube-quick-edit')`));
  }
  await nav('Gantt');
  const streamChevron = await evaluate(`Boolean(document.querySelector('.gantt-row.section button[aria-expanded]'))`);
  if (streamChevron) {
    record('Gantt stream name opens Streams and chevron remains separate', await evaluate(`(()=>{const row=[...document.querySelectorAll('.gantt-row.section')].find(r=>r.querySelector('button.sort-heading'));return !!row&&!!row.querySelector('button[aria-expanded]')&&!!row.querySelector('button.sort-heading[title^="Open "]')})()`));
  }
  await nav('Tasks');
  await click('Add Task');
  record('New stream available in task selection after navigation', await evaluate(`[...document.querySelectorAll('select option')].some(o=>o.textContent.includes('Fresh selection stream'))`));
  await evaluate(`document.querySelector('form[data-create-draft] button.secondary').click()`);
  await nav('Overview');
  await click('Edit Project');
  await waitFor(`Boolean(document.querySelector('[role="dialog"]'))`);
  await evaluate(`document.querySelector('[role="dialog"]').focus()`);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  record('Tab from dialog container enters first control', await evaluate(`(()=>{const d=document.querySelector('[role="dialog"]');return document.activeElement===d.querySelector('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')})()`));
  await evaluate(`document.querySelector('[role="dialog"]').focus()`);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
  record('Shift+Tab from dialog container enters last control', await evaluate(`(()=>{const d=document.querySelector('[role="dialog"]');return document.activeElement===[...d.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].at(-1)})()`));
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor(`!document.querySelector('[role="dialog"]')`);
  await cdp.send('Emulation.clearDeviceMetricsOverride');
}
