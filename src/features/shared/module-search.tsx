"use client";
import { useEffect, useId, useRef, useState } from "react";

/** Consistent collapsible search toolbar for record-management modules. */
export function ModuleSearch({title,value,onChange,placeholder,disabled=false}:{
  title:string;value:string;onChange:(value:string)=>void;placeholder:string;disabled?:boolean;
}) {
  const [expanded,setExpanded]=useState(false);
  const id=useId();
  const triggerRef=useRef<HTMLButtonElement>(null);
  const rootRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!expanded)return;
    const onPointerDown=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!rootRef.current?.contains(event.target))setExpanded(false);
    };
    document.addEventListener("pointerdown",onPointerDown);
    return ()=>document.removeEventListener("pointerdown",onPointerDown);
  },[expanded]);
  const active=value.trim().length>0;
  const open=expanded&&!disabled;
  return <div ref={rootRef} className="module-search-toolbar">
    <button ref={triggerRef} type="button" className="secondary" disabled={disabled} aria-expanded={open} aria-controls={id} onClick={()=>setExpanded(previous=>!previous)}>
      Search {title}{active?" · Active":""}
    </button>
    {open&&<div id={id} className="module-search-controls">
      <label className="search-input">Search {title}
        <input autoFocus type="search" value={value} onChange={event=>onChange(event.target.value)} onKeyDown={event=>{if(event.key==="Escape"){event.stopPropagation();if(value)onChange("");else {setExpanded(false);triggerRef.current?.focus();}}}} placeholder={placeholder}/>
      </label>
      {active&&<button type="button" className="secondary" onClick={()=>onChange("")} aria-label={`Clear ${title} search`}>Clear</button>}
    </div>}
  </div>;
}
