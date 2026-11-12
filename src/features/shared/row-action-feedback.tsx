"use client";
import { createContext,useContext,useEffect,useRef,useState,type ReactNode } from 'react';
import type { ProjectStore } from '../../application';
import { ROW_FEEDBACK_MS,rowActionSucceeded,separatorTarget,type RowFeedbackKind } from './row-action-feedback-model';
type Plan={id:string;ids:string[];scope:HTMLElement;panel:HTMLElement;fallback?:string;module:string|null};
type Runner=(button:HTMLButtonElement,action:()=>void)=>void;
const Context=createContext<Runner|null>(null);
export const useRowActionFeedback=()=>useContext(Context);
function capture(row:HTMLElement):Plan|null {
 const scope=row.parentElement,panel=row.closest<HTMLElement>('.panel,[role="dialog"],.risk-actions');if(!scope||!panel||!row.dataset.navigationId)return null;
 return{id:row.dataset.navigationId,ids:[...scope.children].filter((item):item is HTMLElement=>item instanceof HTMLElement&&!!item.dataset.navigationId&&item.checkVisibility()).map(item=>item.dataset.navigationId!),scope,panel,fallback:scope.matches('.baseline-list')?'.baseline-list':undefined,module:document.querySelector('nav [aria-current="page"]')?.getAttribute('data-module')??null};
}
export function RowActionFeedbackProvider({store,children}:{store:ProjectStore;children:ReactNode}){
 const staged=useRef<Plan|null>(null),cleanups=useRef(new Set<()=>void>()),[announcement,setAnnouncement]=useState({id:0,text:''});
 useEffect(()=>()=>{cleanups.current.forEach(clean=>clean());staged.current=null;},[store]);
 const pulse=(plan:Plan,kind:RowFeedbackKind)=>{
  let frame=0,timer:ReturnType<typeof setTimeout>|undefined,node:HTMLDivElement|null=null,animation:Animation|undefined,finished=false;
  const clean=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);clearTimeout(timer);animation?.cancel();node?.remove();cleanups.current.delete(clean);};cleanups.current.add(clean);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const position=()=>{
   if(finished)return;
   if((document.querySelector('nav [aria-current="page"]')?.getAttribute('data-module')??null)!==plan.module){clean();return;}
   const scope=plan.scope.isConnected?plan.scope:plan.fallback?document.querySelector<HTMLElement>(plan.fallback):null;
   const rows=scope?[...scope.children].filter((item):item is HTMLElement=>item instanceof HTMLElement&&!!item.dataset.navigationId&&item.checkVisibility()):[];
   let target:HTMLElement|null=null,edge:'top'|'bottom'='top';
   if(kind==='duplicate')target=rows.find(row=>row.dataset.navigationId===plan.id)??null;
   else{const selected=separatorTarget(plan.ids,new Set(rows.map(row=>row.dataset.navigationId!)),plan.id);if(selected){target=rows.find(row=>row.dataset.navigationId===selected.id)??null;edge=selected.edge;}else target=scope?.isConnected?scope:plan.panel.isConnected?plan.panel.querySelector<HTMLElement>('.empty'):null;}
   if(!target?.isConnected){clean();return;}
   const rect=target.getBoundingClientRect();
   if(!node){node=document.createElement('div');node.className=`row-action-pulse row-action-pulse--${kind}`;node.dataset.feedbackKind=kind;node.dataset.sourceId=plan.id;node.dataset.duration=String(ROW_FEEDBACK_MS);node.dataset.reducedMotion=String(reduced);node.setAttribute('aria-hidden','true');document.body.append(node);
    if(!reduced)animation=node.animate([{opacity:.7},{opacity:0}],{duration:ROW_FEEDBACK_MS,easing:'ease-out'});else node.style.opacity='.55';timer=setTimeout(clean,ROW_FEEDBACK_MS);
   }
   node.dataset.targetId=target.dataset.navigationId??'empty';node.dataset.edge=edge;
   Object.assign(node.style,{left:`${rect.left}px`,top:`${kind==='delete'?(edge==='top'?rect.top:rect.bottom)-1:rect.top}px`,width:`${rect.width}px`,height:kind==='delete'?'3px':`${rect.height}px`});
   frame=requestAnimationFrame(position);
  };
  frame=requestAnimationFrame(position);
 };
 const run:Runner=(button,action)=>{
  const name=button.getAttribute('aria-label')??button.textContent??'',kind:RowFeedbackKind|null=/^Duplicate\b/i.test(name)?'duplicate':/^Delete\b|^Remove\b/i.test(name)?'delete':null;
  if(!kind){staged.current=null;action();return;}
  const row=button.closest<HTMLElement>('[data-navigation-id]'),plan=row?capture(row):staged.current;
  const plans=plan?[plan]:kind==='delete'?[...document.querySelectorAll<HTMLElement>('.workspace [data-navigation-id]')].map(capture).filter((value):value is Plan=>!!value):[];
  const before=store.getState();action();const after=store.getState();let successful=false;
  for(const candidate of plans)if(rowActionSucceeded(kind,candidate.id,before,after)){pulse(candidate,kind);successful=true;}
  if(successful){staged.current=null;setAnnouncement(previous=>({id:previous.id+1,text:`${kind==='delete'?'Deleted':'Duplicated'} record.`}));}else staged.current=plan;
 };
 return <Context.Provider value={run}>{children}<span key={announcement.id} className="sr-only" role="status" aria-live="polite">{announcement.text}</span></Context.Provider>;
}
