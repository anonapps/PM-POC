"use client";
import { useLayoutEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { positionAnchoredPanel } from "./filter-panel-position";

/** Compact live search and a viewport-constrained, portalled filter panel. */
export function ModuleSearch({title,value,onChange,placeholder,disabled=false,children,activeFilters=false,onClearFilters,defaultOpen=false,label}:{
  title:string;value:string;onChange:(value:string)=>void;placeholder:string;disabled?:boolean;
  children?:ReactNode;activeFilters?:boolean;onClearFilters?:()=>void;defaultOpen?:boolean;label?:string;
}) {
  const [expanded,setExpanded]=useState(defaultOpen);
  const id=useId();
  const triggerRef=useRef<HTMLButtonElement>(null);
  const rootRef=useRef<HTMLDivElement>(null);
  const panelRef=useRef<HTMLDivElement>(null);
  const open=expanded&&!disabled;
  useLayoutEffect(()=>{
    if(!open)return;
    const update=()=>{if(rootRef.current&&panelRef.current){if(!positionAnchoredPanel(rootRef.current,panelRef.current))setExpanded(false);}};
    const observer=new ResizeObserver(update);if(panelRef.current)observer.observe(panelRef.current);
    update();
    panelRef.current?.querySelector<HTMLElement>('input,button')?.focus();
    const dismiss=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!rootRef.current?.contains(event.target)&&!panelRef.current?.contains(event.target))setExpanded(false);
    };
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();setExpanded(false);triggerRef.current?.focus();}};
    document.addEventListener("pointerdown",dismiss);
    document.addEventListener("keydown",escape);
    window.addEventListener("resize",update);
    window.addEventListener("scroll",update,true);
    return ()=>{observer.disconnect();document.removeEventListener("pointerdown",dismiss);document.removeEventListener("keydown",escape);window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true);};
  },[open]);
  const active=Boolean(value.trim())||activeFilters;
  return <div ref={rootRef} className="module-search-toolbar shared-search-filter">
    <label className="toolbar-search-label"><span className="sr-only">{label??`Search ${title}`}</span><input type="search" aria-label={label??`Search ${title}`} disabled={disabled} value={value} onChange={event=>onChange(event.target.value)} placeholder={placeholder}/></label>
    <button ref={triggerRef} type="button" className="secondary filter-trigger" disabled={disabled} title={`Search ${title}`} aria-label={`Search and filter ${title}`} aria-expanded={open} aria-controls={open?id:undefined} data-active={activeFilters||undefined} onClick={()=>setExpanded(previous=>!previous)}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h18M6 12h12M9 19h6"/></svg><span className="sr-only">Filters{active?" · Active":""}</span>
    </button>
    {open&&createPortal(<div ref={panelRef} id={id} className="module-search-controls filter-popover" role="region" aria-label={`Search and filter controls for ${title}`}>
      <div className="filter-panel-heading"><strong>Filters</strong><button type="button" className="secondary" onClick={()=>{onChange("");onClearFilters?.();}}>Clear all</button></div>
      <div className="filter-sections">{children}</div>
    </div>,document.body)}
  </div>;
}
