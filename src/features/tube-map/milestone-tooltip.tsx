"use client";
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type FocusEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { ProjectState } from "../../application";
import type { ScheduleComparison } from "../../domain/baselines";
import { tubeMapDisplayDate } from "./local-date";

const Context=createContext<{id:string;activeKey:string|null;show:(anchor:HTMLElement,content:ReactNode,key:string)=>void;hide:()=>void;keep:()=>void;dismiss:()=>void}|null>(null);
/** One hoverable, keyboard-visible tooltip, portalled outside every chart scroller. */
export function TubeTooltipProvider({children}:{children:ReactNode}) {
  const id=useId(),node=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const [active,setActive]=useState<{anchor:HTMLElement;content:ReactNode;key:string}|null>(null),[position,setPosition]=useState({left:8,top:8});
  const keep=()=>clearTimeout(timer.current);
  const hide=()=>{keep();timer.current=setTimeout(()=>setActive(null),120);};
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  useEffect(()=>{
    if(!active)return;
    const clear=()=>setActive(null),escape=(event:KeyboardEvent)=>{if(event.key==="Escape")clear();};
    const scroll=(event:Event)=>{if(!node.current?.contains(event.target as Node))clear();};
    const observer=new MutationObserver(()=>{if(!active.anchor.isConnected)clear();});observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener("keydown",escape);document.addEventListener("scroll",scroll,true);window.addEventListener("resize",clear);
    return()=>{observer.disconnect();document.removeEventListener("keydown",escape);document.removeEventListener("scroll",scroll,true);window.removeEventListener("resize",clear);};
  },[active]);
  useLayoutEffect(()=>{
    if(!active||!node.current)return;
    const anchor=active.anchor.getBoundingClientRect(),box=node.current.getBoundingClientRect();
    setPosition({left:Math.max(8,Math.min(anchor.left,window.innerWidth-box.width-8)),top:Math.max(8,anchor.bottom+8+box.height<=window.innerHeight-8?anchor.bottom+8:anchor.top-box.height-8)});
  },[active]);
  return <Context.Provider value={{id,activeKey:active?.key??null,show:(anchor,content,key)=>{keep();setActive({anchor,content,key});},hide,keep,dismiss:()=>{keep();setActive(null);}}}>{children}{active&&createPortal(<div ref={node} id={id} role="tooltip" className="tube-milestone-tooltip" style={position} onMouseEnter={keep} onMouseLeave={hide}>{active.content}</div>,document.body)}</Context.Provider>;
}

export function useTubeTooltip(content:ReactNode) {
  const tooltip=useContext(Context),key=useId();
  return {dismiss:()=>tooltip?.dismiss(),events:{
    "aria-describedby":tooltip?.activeKey===key?tooltip.id:undefined,
    onMouseEnter:(event:MouseEvent<HTMLElement>)=>{tooltip?.show(event.currentTarget,content,key);},
    onMouseLeave:()=>tooltip?.hide(),
    onFocus:(event:FocusEvent<HTMLElement>)=>{tooltip?.show(event.currentTarget,content,key);},
    onBlur:()=>tooltip?.hide(),
  }};
}

export function milestoneTooltip(state:ProjectState, row:ScheduleComparison, historical=false, historicalStreams:readonly {id:string;name:string}[]=[]) {
  const item=historical?row.baseline:row.current;if(!item)return null;
  const current=state.milestones.find(m=>m.id===item.id&&!m.deletion.isDeleted);
  const names=new Map((historical?historicalStreams:state.streams).map(s=>[s.id,s.name]));
  const scope=item.projectWide?"Project-wide":item.streamIds.map(id=>names?.get(id)??id).join(", ");
  const date=(value:string|null|undefined)=>value?tubeMapDisplayDate(value):"Undated";
  return <><strong>{item.humanId} · {item.name}</strong><span>{historical?"Historical milestone":"Current milestone"}</span><span>{historical?"Baseline":"Planned"}: {date(item.finishDate)}</span>{!historical&&current?.actualCompletionDate&&<span>Actual: {date(current.actualCompletionDate)}</span>}<span>Status: {historical?"Not captured in baseline":current?.status??"Removed"}</span><span>Scope: {scope||"Unassigned"}</span>{historical&&current&&<span>Current status: {current.status}</span>}{row.baseline&&<><span>{historical?"Current":"Baseline"}: {row.current?date(historical?row.current.finishDate:row.baseline.finishDate):"Removed"}</span><span>Variance: {row.finishVariance===null?"Unavailable":`${row.finishVariance>0?"+":""}${row.finishVariance} days`}</span></>}</>;
}
