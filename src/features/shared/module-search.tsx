"use client";
import { useState } from "react";

/** Consistent collapsible search toolbar for record-management modules. */
export function ModuleSearch({title,value,onChange,placeholder}:{
  title:string;value:string;onChange:(value:string)=>void;placeholder:string;
}) {
  const [expanded,setExpanded]=useState(false);
  const open=expanded||value.trim().length>0;
  return <div className="module-search-toolbar">
    <button type="button" className="secondary" aria-expanded={open} aria-controls={`search-${title.replace(/\\s+/g,"-")}`} onClick={()=>setExpanded(previous=>!previous)}>
      Search {title}{value.trim()? " · Active":""}
    </button>
    {open&&<label className="search-input" id={`search-${title.replace(/\\s+/g,"-")}`}>
      Search {title}
      <input type="search" value={value} onChange={event=>onChange(event.target.value)} placeholder={placeholder}/>
    </label>}
  </div>;
}
