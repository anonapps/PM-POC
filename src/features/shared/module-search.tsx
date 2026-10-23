"use client";
import { useId, useRef, useState } from "react";

/** Consistent collapsible search toolbar for record-management modules. */
export function ModuleSearch({title,value,onChange,placeholder}:{
  title:string;value:string;onChange:(value:string)=>void;placeholder:string;
}) {
  const [expanded,setExpanded]=useState(false);
  const id=useId();
  const triggerRef=useRef<HTMLButtonElement>(null);
  const active=value.trim().length>0;
  const open=expanded;
  return <div className="module-search-toolbar">
    <button ref={triggerRef} type="button" className="secondary" aria-expanded={open} aria-controls={id} onClick={()=>setExpanded(previous=>!previous)}>
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
