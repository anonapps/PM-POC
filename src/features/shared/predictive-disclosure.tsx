"use client";
import { filterPanelPosition } from "./filter-panel-position";
import { useEffect, useRef, type ComponentPropsWithRef, type Ref } from "react";
/** Native disclosure with consistent dismissal and keyboard focus restoration. */
export function PredictiveDisclosure({children,disabled=false,ref:forwardedRef,...props}:ComponentPropsWithRef<"details">&{disabled?:boolean}) {
  const localRef=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{
    const root=localRef.current;
    // Native top-layer popovers retain DOM ancestry, query reset and selection semantics.
    const panel=root?.querySelector<HTMLElement>(":scope > .multi-select-options");
    const position=()=>{
      if(!root?.open||!panel)return;
      const anchor=root.querySelector("summary")!.getBoundingClientRect();
      const placement=filterPanelPosition(anchor,window.innerWidth,window.innerHeight);
      Object.assign(panel.style,{left:`${placement.left}px`,top:`${placement.top}px`,width:`${Math.min(placement.width,Math.max(260,anchor.width))}px`,maxHeight:`${placement.maxHeight}px`});
    };
    const toggle=()=>{
      if(!panel)return;
      panel.setAttribute("popover","manual");
      if(root?.open){position();panel.showPopover();}else if(panel.matches(":popover-open"))panel.hidePopover();
    };
    const dismiss=(event:PointerEvent)=>{
      if(root?.open&&event.target instanceof Node&&!root.contains(event.target))root.open=false;
    };
    root?.addEventListener("toggle",toggle);
    document.addEventListener("pointerdown",dismiss);
    window.addEventListener("resize",position);
    window.addEventListener("scroll",position,true);
    return ()=>{root?.removeEventListener("toggle",toggle);document.removeEventListener("pointerdown",dismiss);window.removeEventListener("resize",position);window.removeEventListener("scroll",position,true);if(panel?.matches(":popover-open"))panel.hidePopover();};
  },[]);
  const assign=(node:HTMLDetailsElement|null)=>{
    localRef.current=node;
    const ref=forwardedRef as Ref<HTMLDetailsElement>;
    if(typeof ref==="function")ref(node);else if(ref)ref.current=node;
  };
  return <details {...props} ref={assign} onClick={event=>{if(disabled)event.preventDefault();else props.onClick?.(event);}} onKeyDown={event=>{
    props.onKeyDown?.(event);
    if(event.defaultPrevented)return;
    if(event.key==="Escape"){event.preventDefault();event.stopPropagation();event.currentTarget.open=false;event.currentTarget.querySelector("summary")?.focus();}
    else if(disabled&&(event.key==="Enter"||event.key===" "))event.preventDefault();
  }}>{children}</details>;
}
