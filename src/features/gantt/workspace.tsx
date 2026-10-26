"use client";
import {useLayoutEffect,useRef,useState} from "react";
import type {ProjectStore} from "../../application";
import type {ModuleName} from "../shell/shell";
import {TasksModule} from "../tasks/tasks";
import {GanttView} from "./gantt";

/** Layout only: both existing modules edit the same canonical project store. */
export function GanttWorkspace({store,navigate}:{store:ProjectStore;navigate:(module:ModuleName,entityId?:string)=>void}) {
  const [extended,setExtended]=useState(false),[tasksMounted,setTasksMounted]=useState(false);
  const [fraction,setFraction]=useState(.55),[minimumUpper,setMinimumUpper]=useState(260),[available,setAvailable]=useState(800);
  const workspace=useRef<HTMLDivElement>(null),tasks=useRef<HTMLDivElement>(null),dragging=useRef(false);
  useLayoutEffect(()=>{
    const root=workspace.current;if(!root)return;
    const measure=()=>root.style.setProperty('--gantt-available-height',`${Math.max(1,Math.floor(window.innerHeight-root.getBoundingClientRect().top))}px`);
    const observer=new ResizeObserver(measure);observer.observe(root.closest('main')!);observer.observe(root.closest('.app-main')!.querySelector('header')!);
    window.addEventListener('resize',measure);measure();
    return()=>{observer.disconnect();window.removeEventListener('resize',measure);};
  },[]);
  useLayoutEffect(()=>{
    const root=workspace.current,lower=tasks.current;if(!root||!extended)return;
    const controls=[...root.querySelectorAll<HTMLElement>('.gantt-panel>.page-toolbar,.gantt-panel>.baseline-controls,.gantt-panel>footer')];
    const taskToolbar=lower?.querySelector<HTMLElement>('.page-toolbar');
    const measure=()=>{
      const nextMinimum=Math.ceil(controls.reduce((height,control)=>height+control.getBoundingClientRect().height,0))+100;
      setMinimumUpper(Math.max(200,nextMinimum));
      setAvailable(Math.max(1,root.getBoundingClientRect().height-12));
      if(taskToolbar)lower?.style.setProperty('--module-toolbar-height',`${taskToolbar.getBoundingClientRect().height}px`);
    };
    const observer=new ResizeObserver(measure);observer.observe(root);controls.forEach(control=>observer.observe(control));if(taskToolbar)observer.observe(taskToolbar);measure();
    return()=>observer.disconnect();
  },[extended,tasksMounted]);
  const changeMode=(next:boolean)=>{if(next)setTasksMounted(true);setExtended(next);};
  const resize=(height:number)=>{
    const total=Math.max(1,(workspace.current?.getBoundingClientRect().height??available+12)-12);
    setFraction(Math.max(minimumUpper,Math.min(total-200,height))/total);
  };
  const upper=Math.max(minimumUpper,Math.min(available-200,fraction*available));
  return <div ref={workspace} className={`gantt-workspace${extended?' gantt-extended':''}`} style={extended?{gridTemplateRows:`minmax(${minimumUpper}px,${fraction}fr) 12px minmax(200px,${1-fraction}fr)`,minHeight:minimumUpper+212}:undefined}>
    <div className="gantt-pane"><GanttView store={store} navigate={navigate} extended={extended} onModeChange={changeMode}/></div>
    {extended&&<div className="gantt-splitter" role="separator" tabIndex={0} aria-label="Resize Gantt and Tasks panes" aria-orientation="horizontal" aria-valuemin={Math.round(minimumUpper/available*100)} aria-valuemax={Math.round((available-200)/available*100)} aria-valuenow={Math.round(upper/available*100)} aria-valuetext={`Gantt ${Math.round(upper/available*100)}%, Tasks ${100-Math.round(upper/available*100)}%`} onKeyDown={event=>{
      if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;event.preventDefault();resize(upper+(event.key==='ArrowUp'?-1:1)*(event.shiftKey?64:16));
    }} onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.focus();dragging.current=true;event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{if(dragging.current&&workspace.current)resize(event.clientY-workspace.current.getBoundingClientRect().top-6);}} onPointerUp={event=>{dragging.current=false;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}} onPointerCancel={()=>{dragging.current=false;}} onLostPointerCapture={()=>{dragging.current=false;}}><span aria-hidden="true">•••</span></div>}
    <div ref={tasks} className="gantt-tasks-pane" hidden={!extended}>{tasksMounted&&<TasksModule store={store}/>}</div>
  </div>;
}
