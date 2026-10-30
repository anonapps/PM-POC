"use client";
import {useId,useLayoutEffect,useRef,useState} from "react";
import type {ProjectStore} from "../../application";
import type {ModuleName} from "../shell/shell";
import {TasksModule} from "../tasks/tasks";
import {CriticalPathAnalysis} from "../critical-path/analysis-panel";
import {GanttView} from "./gantt";

/** Layout only: both existing modules edit the same canonical project store. */
export function GanttWorkspace({store,navigate,openAnalysis=false}:{store:ProjectStore;navigate:(module:ModuleName,entityId?:string)=>void;openAnalysis?:boolean}) {
  const [extended,setExtended]=useState(openAnalysis),[tasksMounted,setTasksMounted]=useState(openAnalysis);
  const [lowerPanel,setLowerPanel]=useState<"tasks"|"analysis">(openAnalysis?"analysis":"tasks"),[selection,setSelection]=useState<{id:string|null;request:number;source:"chart"|"analysis"}>({id:null,request:0,source:"analysis"});
  const tabsId=useId();
  const selectedId=selection.id;
  const selectTask=(id:string|null,source:"chart"|"analysis"="analysis")=>setSelection(current=>({id,request:current.request+1,source}));
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
    const chartHeading=root.querySelector<HTMLElement>('.gantt-item-heading');
    const firstRows=[...root.querySelectorAll<HTMLElement>('.gantt-row')].slice(0,2).flatMap(row=>row.firstElementChild instanceof HTMLElement?[row.firstElementChild]:[]);
    const measure=()=>{
      const visibleChart=Math.max(100,(chartHeading?.getBoundingClientRect().height??0)+firstRows.reduce((height,row)=>height+row.getBoundingClientRect().height,0)+2);
      const nextMinimum=Math.ceil(controls.reduce((height,control)=>height+control.getBoundingClientRect().height,0)+visibleChart);
      setMinimumUpper(Math.max(200,nextMinimum));
      setAvailable(Math.max(1,root.getBoundingClientRect().height-12));
      if(taskToolbar)lower?.style.setProperty('--module-toolbar-height',`${taskToolbar.getBoundingClientRect().height}px`);
    };
    const observer=new ResizeObserver(measure);observer.observe(root);controls.forEach(control=>observer.observe(control));if(chartHeading)observer.observe(chartHeading);firstRows.forEach(row=>observer.observe(row));if(taskToolbar)observer.observe(taskToolbar);measure();
    return()=>observer.disconnect();
  },[extended,tasksMounted]);
  const changeMode=(next:boolean)=>{if(next){setTasksMounted(true);setLowerPanel("tasks");}setExtended(next);};
  const resize=(height:number)=>{
    const total=Math.max(1,(workspace.current?.getBoundingClientRect().height??available+12)-12);
    setFraction(Math.max(minimumUpper,Math.min(total-200,height))/total);
  };
  const upper=Math.max(minimumUpper,Math.min(available-200,fraction*available));
  return <div ref={workspace} className={`gantt-workspace${extended?' gantt-extended':''}`} style={extended?{gridTemplateRows:`${upper}px 12px minmax(200px,1fr)`,minHeight:minimumUpper+212}:undefined}>
    <div className="gantt-pane"><GanttView store={store} navigate={navigate} extended={extended} onModeChange={changeMode} selectedTaskId={extended&&lowerPanel==="analysis"?selectedId:null} selectionRequest={selection.request} onSelectTask={extended&&lowerPanel==="analysis"?id=>selectTask(id,"chart"):undefined}/></div>
    {extended&&<div className="gantt-splitter" role="separator" tabIndex={0} aria-label={lowerPanel==="tasks"?"Resize Gantt and Tasks panes":"Resize Gantt and Critical Path Analysis panes"} aria-orientation="horizontal" aria-valuemin={Math.round(minimumUpper/available*100)} aria-valuemax={Math.round((available-200)/available*100)} aria-valuenow={Math.round(upper/available*100)} aria-valuetext={`Gantt ${Math.round(upper/available*100)}%, ${lowerPanel==="tasks"?"Tasks":"Critical Path Analysis"} ${100-Math.round(upper/available*100)}%`} onKeyDown={event=>{
      if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;event.preventDefault();resize(upper+(event.key==='ArrowUp'?-1:1)*(event.shiftKey?64:16));
    }} onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.focus();dragging.current=true;event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{if(dragging.current&&workspace.current)resize(event.clientY-workspace.current.getBoundingClientRect().top-6);}} onPointerUp={event=>{dragging.current=false;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}} onPointerCancel={()=>{dragging.current=false;}} onLostPointerCapture={()=>{dragging.current=false;}}><span aria-hidden="true">•••</span></div>}
    <div ref={tasks} className={`gantt-tasks-pane${lowerPanel==="analysis"?" analysis-active":""}`} hidden={!extended}>{extended&&<div className="analysis-panel-selector" role="tablist" aria-label="Gantt lower panel" onKeyDown={event=>{
      if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
      event.preventDefault();
      const next=event.key==="Home"?"tasks":event.key==="End"?"analysis":lowerPanel==="tasks"?"analysis":"tasks";
      setLowerPanel(next);
      event.currentTarget.querySelector<HTMLButtonElement>(`[data-panel="${next}"]`)?.focus({preventScroll:true});
    }}>{(["tasks","analysis"] as const).map(panel=><button key={panel} type="button" role="tab" id={`${tabsId}-${panel}-tab`} aria-controls={`${tabsId}-${panel}-panel`} aria-selected={lowerPanel===panel} tabIndex={lowerPanel===panel?0:-1} data-panel={panel} onClick={()=>setLowerPanel(panel)}>{panel==="tasks"?"Tasks":"Critical Path Analysis"}</button>)}</div>}<div role="tabpanel" id={`${tabsId}-tasks-panel`} aria-labelledby={`${tabsId}-tasks-tab`} hidden={lowerPanel!=="tasks"}>{tasksMounted&&<TasksModule store={store}/>}</div><div role="tabpanel" id={`${tabsId}-analysis-panel`} aria-labelledby={`${tabsId}-analysis-tab`} hidden={lowerPanel!=="analysis"}>{extended&&lowerPanel==="analysis"&&<CriticalPathAnalysis store={store} selectedId={selectedId} selectionRequest={selection.request} revealSelection={selection.source==="chart"} onSelect={selectTask} onOpenTask={id=>navigate("Tasks",id)}/>}</div></div>
  </div>;
}
