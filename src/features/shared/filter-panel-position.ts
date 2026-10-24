/** Measured popup geometry. Above placement uses actual content height, not a guessed budget. */
export function filterPanelPosition(anchor:{left:number;top:number;bottom:number},width:number,height:number,panelHeight=480,requestedWidth=400) {
 const margin=8,gap=6,panelWidth=Math.min(requestedWidth,Math.max(0,width-margin*2));
 const below=Math.max(0,height-anchor.bottom-gap-margin),above=Math.max(0,anchor.top-gap-margin);
 const desired=Math.min(480,Math.max(0,panelHeight));
 const useAbove=below<desired&&above>below;
 const maxHeight=Math.min(desired,useAbove?above:below);
 return {left:Math.max(margin,Math.min(anchor.left,width-panelWidth-margin)),top:useAbove?Math.max(margin,anchor.top-gap-maxHeight):Math.max(margin,Math.min(height-margin,anchor.bottom+gap)),width:panelWidth,maxHeight};
}
/** Call after showing a native popover or mounting a portal, then on resize/scroll/content change. */
export function positionAnchoredPanel(anchor:HTMLElement,panel:HTMLElement,requestedWidth=400) {
 const rect=anchor.getBoundingClientRect();
 if(rect.bottom<=0||rect.top>=window.innerHeight||rect.right<=0||rect.left>=window.innerWidth)return false;
 for(let parent=anchor.parentElement;parent;parent=parent.parentElement){
  const style=getComputedStyle(parent);if(!/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`))continue;
  const bounds=parent.getBoundingClientRect();if(rect.bottom<=bounds.top||rect.top>=bounds.bottom||rect.right<=bounds.left||rect.left>=bounds.right)return false;
 }

 panel.style.width=`${Math.min(requestedWidth,window.innerWidth-16)}px`;
 const height=Math.min(480,panel.scrollHeight+2);
 const placement=filterPanelPosition(rect,window.innerWidth,window.innerHeight,height,requestedWidth);
 Object.assign(panel.style,{left:`${placement.left}px`,top:`${placement.top}px`,width:`${placement.width}px`,maxHeight:`${placement.maxHeight}px`});
 return true;
}
