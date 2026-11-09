"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Hint={anchor:Element;text:string;restore:()=>void};
/** One delegated surface for native title hints, including SVG connector titles. */
export function TitleTooltipProvider() {
  const id=useId(),node=useRef<HTMLDivElement>(null);
  const [hint,setHint]=useState<Hint|null>(null),[position,setPosition]=useState({left:8,top:8});
  useEffect(()=>{
    let current:Hint|null=null,timer:ReturnType<typeof setTimeout>|undefined;
    let visible=false,pressing=false,pressedAnchor:Element|null=null,pressTimer:ReturnType<typeof setTimeout>|undefined;
    const unDescribe=(anchor:Element)=>{
      const descriptions=(anchor.getAttribute('aria-describedby')??'').split(/\s+/).filter(value=>value&&value!==id);
      if(descriptions.length)anchor.setAttribute('aria-describedby',descriptions.join(' '));else anchor.removeAttribute('aria-describedby');
    };
    const close=()=>{clearTimeout(timer);visible=false;setHint(null);if(current)unDescribe(current.anchor);};
    const release=()=>{close();observe.disconnect();current?.restore();current=null;};
    const find=(target:EventTarget|null):Element|null=>{
      if(!(target instanceof Element))return null;
      for(let item:Element|null=target;item&&item!==document.body;item=item.parentElement){
        if(item.matches('[role="tooltip"]'))return null;
        if(item.getAttribute('title')?.trim()||item instanceof SVGElement&&item.querySelector(':scope > title')?.textContent?.trim())return item;
      }
      return null;
    };
    const activate=(event:Event)=>{
      const target=event.target;
      if(event.type==='focusin'&&pressing)return;
      // Moving within the active trigger must not restart its delay or restore a native title.
      if(current&&target instanceof Node&&current.anchor.contains(target))return;
      const anchor=find(target);release();pressedAnchor=null;if(!anchor)return;
      const title=anchor.getAttribute('title'),svgTitle=title===null?anchor.querySelector(':scope > title'):null;
      const text=title??svgTitle?.textContent??'';
      const describedBy=anchor.getAttribute('aria-describedby');
      if(title!==null)anchor.removeAttribute('title');else if(svgTitle)svgTitle.textContent='';
      const next:Hint={anchor,text,restore:()=>{
        if(title!==null&&!anchor.hasAttribute('title'))anchor.setAttribute('title',title);
        else if(svgTitle&&!svgTitle.textContent)svgTitle.textContent=text;
        unDescribe(anchor);
      }};
      current=next;observe.observe(document.body,{childList:true,subtree:true});
      const show=()=>{
        if(!anchor.isConnected)return;
        anchor.setAttribute('aria-describedby',[describedBy,id].filter(Boolean).join(' '));visible=true;setHint(next);
      };
      if(event.type==='focusin')show();else timer=setTimeout(show,300);
    };
    const leave=(event:Event)=>{
      const next=(event as MouseEvent|FocusEvent).relatedTarget;
      if(current&&next instanceof Node&&current.anchor.contains(next))return;
      if(pressedAnchor&&next instanceof Node&&pressedAnchor.contains(next))return;
      pressedAnchor=null;release();
    };
    const press=(event:PointerEvent)=>{
      const anchor=current?.anchor??find(event.target);release();pressedAnchor=anchor;pressing=true;
      clearTimeout(pressTimer);pressTimer=setTimeout(()=>{pressing=false;},0);
    };
    const move=(event:PointerEvent)=>{if(!current&&pressedAnchor&&event.target instanceof Node&&pressedAnchor.contains(event.target)&&!event.buttons)activate(event);};
    const scroll=()=>{if(visible&&current&&document.activeElement===current.anchor)setHint({...current});else close();};
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape')close();};
    const observe=new MutationObserver(()=>{if(current&&!current.anchor.isConnected)release();});
    document.addEventListener('pointerover',activate,true);document.addEventListener('focusin',activate,true);
    document.addEventListener('pointerout',leave,true);document.addEventListener('focusout',leave,true);
    document.addEventListener('pointerdown',press,true);document.addEventListener('pointermove',move,true);document.addEventListener('keydown',key,true);
    document.addEventListener('scroll',scroll,true);window.addEventListener('resize',close);
    return()=>{
      release();clearTimeout(pressTimer);observe.disconnect();
      document.removeEventListener('pointerover',activate,true);document.removeEventListener('focusin',activate,true);
      document.removeEventListener('pointerout',leave,true);document.removeEventListener('focusout',leave,true);
      document.removeEventListener('pointerdown',press,true);document.removeEventListener('pointermove',move,true);document.removeEventListener('keydown',key,true);
      document.removeEventListener('scroll',scroll,true);window.removeEventListener('resize',close);
    };
  },[id]);
  useLayoutEffect(()=>{
    if(!hint||!node.current)return;
    const anchor=hint.anchor.getBoundingClientRect(),box=node.current.getBoundingClientRect();
    setPosition({left:Math.max(8,Math.min(anchor.left,window.innerWidth-box.width-8)),top:Math.max(8,anchor.bottom+6+box.height<=window.innerHeight-8?anchor.bottom+6:anchor.top-box.height-6)});
  },[hint]);
  return hint&&createPortal(<div ref={node} id={id} role="tooltip" className="app-tooltip title-tooltip" style={position}>{hint.text}</div>,document.body);
}
