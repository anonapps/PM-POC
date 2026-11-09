/** Text hints explain clipping; action/help and chart hints retain their existing policy. */
export function textHintIsNeeded(anchor:Element,text:string):boolean {
 // Chart-page dialogs/popovers may be portalled outside the chart workspace.
 if(document.querySelector('.workspace.module-gantt,.workspace.module-tube-map'))return true;
 const normalize=(value:string)=>value.replace(/\s+/g,' ').trim();
 const repeated=normalize(anchor.textContent??'')===normalize(text);
 const textHint=anchor.matches('td,th,.scope-pill,.sidebar-project strong,#project-modules button,.predictive-select>summary')||repeated;
 if(!textHint)return true;
 const label=anchor.querySelector<HTMLElement>('.module-label');
 if(label&&!label.checkVisibility({opacityProperty:true,visibilityProperty:true}))return true;
 const short=anchor.querySelector<HTMLElement>('.scope-pill-short');
 if(short?.checkVisibility({opacityProperty:true,visibilityProperty:true}))return true;
 const clippedBox=[anchor,...anchor.querySelectorAll('*')].some(element=>{
  if(!(element instanceof HTMLElement)||!element.checkVisibility({opacityProperty:true,visibilityProperty:true}))return false;
  const style=getComputedStyle(element);
  return (style.overflowX!=='visible'&&element.scrollWidth>element.clientWidth+1)||
   (style.overflowY!=='visible'&&element.scrollHeight>element.clientHeight+1);
 });
 if(clippedBox)return true;
 // Inline labels can be clipped by an ancestor rather than their own box.
 const walker=document.createTreeWalker(anchor,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,parent=node.parentElement;
  if(!node.textContent?.trim()||!parent?.checkVisibility({opacityProperty:true,visibilityProperty:true}))continue;
  const range=document.createRange();range.selectNodeContents(node);
  const rects=[...range.getClientRects()];
  for(let box:HTMLElement|null=parent;box&&box!==document.body;box=box.parentElement){
   const style=getComputedStyle(box),clip=box.getBoundingClientRect();
   if(rects.some(rect=>(style.overflowX!=='visible'&&(rect.left<clip.left+parseFloat(style.borderLeftWidth)-1||rect.right>clip.right-parseFloat(style.borderRightWidth)+1))||
    (style.overflowY!=='visible'&&(rect.top<clip.top+parseFloat(style.borderTopWidth)-1||rect.bottom>clip.bottom-parseFloat(style.borderBottomWidth)+1))))return true;
  }
 }
 return false;
}
