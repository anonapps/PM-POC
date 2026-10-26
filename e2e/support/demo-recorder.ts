import {expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
/** Editorial cues are capture-only DOM, never application source or persisted state. */
export async function installDemoPointer(page:Page){
 await page.addInitScript(()=>{
  const install=()=>{
   const pointer=document.createElement('div'),focus=document.createElement('div');pointer.id='demo-pointer';focus.id='demo-focus';
   for(const node of [pointer,focus]){node.setAttribute('popover','manual');node.setAttribute('aria-hidden','true');Object.assign(node.style,{position:'fixed',inset:'auto',margin:'0',padding:'0',border:'0',overflow:'visible',pointerEvents:'none',background:'transparent'});document.body.append(node);node.showPopover();}
   Object.assign(pointer.style,{left:'64px',top:'100px',width:'30px',height:'38px'});
   pointer.innerHTML='<svg style="overflow:visible" width="30" height="38" viewBox="0 0 30 38"><circle class="pulse" cx="5" cy="5" r="19" fill="none" stroke="#009b9b" stroke-width="2" opacity="0"/><path d="M5 4 L5 29 L11 23 L17 34 L22 31 L16 21 L25 21 Z" fill="white" stroke="#132238" stroke-width="2" stroke-linejoin="round"/></svg>';
   Object.assign(focus.style,{display:'none',border:'2px solid #009b9b',borderRadius:'5px',boxSizing:'border-box'});
   const stats={moves:0,clicks:0,focuses:0};Object.assign(window,{__demoCues:stats});
   const raise=(node:HTMLElement)=>{if(node.matches(':popover-open'))node.hidePopover();node.showPopover();};
   document.addEventListener('pointermove',e=>{stats.moves++;pointer.style.left=`${e.clientX-5}px`;pointer.style.top=`${e.clientY-4}px`;raise(pointer);},true);
   document.addEventListener('pointerdown',()=>{stats.clicks++;raise(pointer);pointer.querySelector('.pulse')!.animate([{opacity:.8,transform:'scale(.5)',transformOrigin:'5px 5px'},{opacity:0,transform:'scale(1.4)',transformOrigin:'5px 5px'}],{duration:260});},true);
   document.addEventListener('focusin',e=>{if(!(e.target instanceof HTMLElement)||!e.target.matches('input,select,textarea,summary,button'))return;stats.focuses++;const r=e.target.getBoundingClientRect();Object.assign(focus.style,{display:'block',left:`${r.left-3}px`,top:`${r.top-3}px`,width:`${r.width+6}px`,height:`${r.height+6}px`});raise(focus);raise(pointer);},true);
   document.addEventListener('focusout',()=>{focus.style.display='none';},true);
  };if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
 });
}
export async function demoRecorder(page:Page,folder:string,capture:boolean){
 type Frame={file:string;at:number};type Scene={title:string;duration:number;frames:Frame[];cues?:unknown};
 const scenes:Scene[]=[];let active:Scene|undefined,start=0,index=0;
 if(capture)mkdirSync(folder,{recursive:true});
 const cdp=capture?await page.context().newCDPSession(page):undefined;
 cdp?.on('Page.screencastFrame',event=>{if(active){const file=join(folder,`frame-${String(index++).padStart(6,'0')}.jpg`);writeFileSync(file,Buffer.from(event.data,'base64'));active.frames.push({file,at:Date.now()-start});}void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});});
 if(cdp)await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:1840,maxHeight:864,everyNthFrame:1});
 return {
  async segment(title:string,seconds:number,action:()=>Promise<void>){
   console.log(title);start=Date.now();if(capture){active={title,duration:seconds,frames:[]};scenes.push(active);const file=join(folder,`frame-${String(index++).padStart(6,'0')}.jpg`);writeFileSync(file,await page.screenshot({type:'jpeg',quality:92}));active.frames.push({file,at:0});}
   await action();console.log(`Completed action in ${Date.now()-start}ms`);
   await expect(page.locator('#demo-pointer')).toBeVisible();expect(await page.locator('#demo-pointer').evaluate(e=>getComputedStyle(e).pointerEvents)).toBe('none');
   if(capture){const remaining=seconds*1000-(Date.now()-start);expect(remaining,`${title} must fit at natural speed`).toBeGreaterThan(0);await page.waitForTimeout(remaining);active!.cues=await page.evaluate(()=>(window as unknown as {__demoCues:unknown}).__demoCues);active=undefined;}
  },
  async finish(){if(cdp){await cdp.send('Page.stopScreencast');await cdp.detach();writeFileSync(join(folder,'scenes.json'),JSON.stringify(scenes,null,2));}return scenes;},
  async pause(ms:number){if(capture)await page.waitForTimeout(ms);}
 };
}
