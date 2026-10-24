"use client";
import { useEffect, useRef, type ComponentPropsWithRef, type Ref } from "react";
/** Native disclosure with consistent dismissal and keyboard focus restoration. */
export function PredictiveDisclosure({children,disabled=false,ref:forwardedRef,...props}:ComponentPropsWithRef<"details">&{disabled?:boolean}) {
  const localRef=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{
    const dismiss=(event:PointerEvent)=>{
      const root=localRef.current;
      if(root?.open&&event.target instanceof Node&&!root.contains(event.target))root.open=false;
    };
    document.addEventListener("pointerdown",dismiss);
    return ()=>document.removeEventListener("pointerdown",dismiss);
  },[]);
  const assign=(node:HTMLDetailsElement|null)=>{
    localRef.current=node;
    const ref=forwardedRef as Ref<HTMLDetailsElement>;
    if(typeof ref==="function")ref(node);else if(ref)ref.current=node;
  };
  return <details {...props} ref={assign} onClick={event=>{if(disabled)event.preventDefault();}} onKeyDown={event=>{
    if(event.key==="Escape"){event.preventDefault();event.stopPropagation();event.currentTarget.open=false;event.currentTarget.querySelector("summary")?.focus();}
    else if(disabled&&(event.key==="Enter"||event.key===" "))event.preventDefault();
  }}>{children}</details>;
}
