"use client";
import { BaselineSelector,useBaselineSelection } from "../baselines/selection";
import { compareSchedule } from "../../domain/baselines";
import { varianceLabel } from "../baselines/baselines";
import { TimelineNavigation } from "../shared/timeline-navigation";
import { PageToolbar } from "../shared/page-toolbar";
import { TASK_STATUSES,type TaskStatus } from "../../domain";
import { FilterChoices } from "../shared/record-filters";
import { TASK_STATUS_COLOURS,TimelineStatusLegend } from "../shared/timeline-status";
import { PredictiveDisclosure } from "../shared/predictive-disclosure";
import { ModuleSearch } from "../shared/module-search";
import { HumanTextInput } from "../shared/human-text";
import { useState, useRef, useLayoutEffect, type CSSProperties } from "react";
import { TodayMarker } from "../shared/today-marker";
import { useProjectState } from "../shell/use-project-state";
import { editTask } from "../tasks/commands";
import { sortRows } from "../shared/sorting";
import type { ModuleName } from "../shell/shell";
import { milestoneDependencyIssues } from "../milestones/dependencies";
import { useDependencyFocus } from "../shared/use-dependency-focus";
import { DependencyConnectors, dependencyCurve } from "../shared/dependency-connectors";
import type { ProjectStore } from "../../application";
import { baselineDelayPosition, barPosition, buildGanttModel, type GanttModel, type GanttZoom, positionForDate, todayPosition } from "./model";

export interface GanttConnectorPath { key: string; path: string; label: string; from:string; to:string; fromX:number; fromY:number; toX:number; toY:number }
export function ganttConnectorPaths(model: GanttModel, rowHeight=36, rowCenters?:readonly number[]): GanttConnectorPath[] {
  return model.dependencies.flatMap((dependency) => {
    const fromIndex = model.rows.findIndex((row) => row.kind === "task" && row.id === dependency.from);
    const toIndex = model.rows.findIndex((row) => row.kind === "task" && row.id === dependency.to);
    if (fromIndex < 0 || toIndex < 0) return [];
    const from = model.rows[fromIndex];
    const to = model.rows[toIndex];
    if (!from.end || !to.start) return [];
    const fromBar = barPosition(from.end, from.end, model.start, model.end);
    const toBar = barPosition(to.start, to.start, model.start, model.end);
    if (!fromBar || !toBar) return [];
    if ((from.end < model.start && to.start < model.start) || (from.end > model.end && to.start > model.end)) return [];
    if (dependency.from === dependency.to) return [];
    const fromX = Math.max(0, Math.min(100, from.end < model.start ? 0 : from.end > model.end ? 100 : fromBar.left + fromBar.width));
    const toX = Math.max(0, Math.min(100, positionForDate(to.start, model.start, model.end)));
    const fromY = rowCenters?.[fromIndex]??fromIndex * rowHeight + 18;
    const toY = rowCenters?.[toIndex]??toIndex * rowHeight + 18;
    return [{ key: `${dependency.from}:${dependency.to}`, path: dependencyCurve(fromX,fromY,toX,toY), label: `${from.label} → ${to.label} · Finish-to-Start`, fromX,fromY,toX,toY,from:dependency.from,to:dependency.to }];
  });
}

export function GanttView({ store, navigate, extended=false, onModeChange }: { store: ProjectStore; navigate: (module: ModuleName, entityId?: string) => void; extended?:boolean; onModeChange?:(extended:boolean)=>void }) {
  const dependencyFocus=useDependencyFocus();
  const bodyRef=useRef<HTMLDivElement>(null);
  const [geometry,setGeometry]=useState<{height:number;centers:number[]}>({height:0,centers:[]});
  const {baseline}=useBaselineSelection();
  const [showBaseline,setShowBaseline]=useState(false),[showVariance,setShowVariance]=useState(false),[showDependencies,setShowDependencies]=useState(true);
  const [zoom, setZoom] = useState<GanttZoom>("Week");
  const [offset, setOffset] = useState(0);
  const [sortStreams, setSortStreams] = useState<"asc" | "desc" | null>(null);
  const [collapsedStreams, setCollapsedStreams] = useState<string[]>([]);
  const [hideEmptyStreams, setHideEmptyStreams] = useState(false);
  const [statuses,setStatuses]=useState<TaskStatus[]>([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editorPosition, setEditorPosition] = useState<CSSProperties>({});
  const [draftName, setDraftName] = useState("");
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");
  const openTaskEditor = (id: string, anchor: HTMLElement) => { const task = state.tasks.find(item=>item.id===id&&!item.deletion.isDeleted);if(!task)return;const rect = anchor.getBoundingClientRect();setEditorPosition({ position: "fixed", left: Math.max(12, Math.min(rect.left, window.innerWidth - 382)), top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 370)), margin: 0 });setEditingTaskId(id);setDraftName(task.name);setDraftStart(task.startDate??"");setDraftEnd(task.endDate??""); };
  const saveTask = () => { if(!editingTaskId || !draftName.trim() || (draftStart&&draftEnd&&draftEnd<draftStart)||[draftStart,draftEnd].some(value=>value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(`${value}T00:00:00Z`))||new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)!==value)))return;const task = store.getState().tasks.find(item=>item.id===editingTaskId&&!item.deletion.isDeleted);if(!task){setEditingTaskId(null);return;}store.execute(editTask(editingTaskId,{name:draftName,startDate:draftStart||null,endDate:draftEnd||null}));setEditingTaskId(null); };
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const state = useProjectState(store);
  const comparisons=new Map((baseline?compareSchedule(baseline.snapshot,state):[]).map(row=>[row.key,row]));
  const model = buildGanttModel(state, zoom, today, offset, hideEmptyStreams,statuses);
  const todayPercent = todayPosition(today, model.start, model.end);
  const showProgress = state.project.metadata.showProgress !== false;
  const streamGroups: { section: (typeof model.rows)[number]; items: (typeof model.rows)[number][] }[] = [];
  for (const row of model.rows) {
    if (row.kind === "section") streamGroups.push({section:row,items:[]});
    else streamGroups[streamGroups.length-1]?.items.push(row);
  }
  const projectGroup = streamGroups.filter(group => group.section.id === "project");
  const sortedGroups = sortStreams ? sortRows(streamGroups.filter(group=>group.section.id!=="project"),{key:"label",direction:sortStreams},group=>group.section.label) : streamGroups.filter(group=>group.section.id!=="project");
  const needle = filterQuery.trim().toLocaleLowerCase();
  const rows = [...projectGroup,...sortedGroups].filter(group=>!needle||group.section.id==="project"||group.section.label.toLocaleLowerCase().includes(needle)||group.items.some(item=>item.label.toLocaleLowerCase().includes(needle))).flatMap(group=>[group.section,...(!needle&&collapsedStreams.includes(group.section.id)?[]:needle&&!group.section.label.toLocaleLowerCase().includes(needle)?group.items.filter(item=>item.label.toLocaleLowerCase().includes(needle)):group.items)]);
  const rowSignature=rows.map(row=>row.id).join("|");
  useLayoutEffect(()=>{
    const body=bodyRef.current;if(!body)return;
    const measure=()=>{
      const top=body.getBoundingClientRect().top;
      const centers=Array.from(body.querySelectorAll<HTMLElement>('.gantt-row>.gantt-track'),track=>{
        const target=track.querySelector<HTMLElement>('.gantt-bar')??track;
        const rect=target.getBoundingClientRect();return rect.top-top+rect.height/2;
      });
      const height=body.getBoundingClientRect().height;
      setGeometry(previous=>previous.height===height&&previous.centers.length===centers.length&&previous.centers.every((value,index)=>value===centers[index])?previous:{height,centers});
    };
    const observer=new ResizeObserver(measure);observer.observe(body);
    body.querySelectorAll('.gantt-track').forEach(track=>observer.observe(track));measure();
    return()=>observer.disconnect();
  },[rowSignature,showVariance,baseline?.id,model.start,model.end,state.tasks,state.milestones,showProgress]);
  const rowHeight=showVariance&&baseline?52:36;
  const connectors = showDependencies?ganttConnectorPaths({...model,rows},rowHeight,geometry.centers.length===rows.length?geometry.centers:undefined):[];
  const focusedConnector=connectors.find(connector=>connector.key===dependencyFocus.activeKey);
  const yearSegments = model.columns.reduce<{year:number;start:number;count:number}[]>((segments,column,index)=>{const year=Number(column.start.slice(0,4));const previous=segments[segments.length-1];if(previous?.year===year)previous.count+=1;else segments.push({year,start:index,count:1});return segments},[]);
  return <section className="panel gantt-panel"><PageToolbar><div><h1 className="module-page-title">Gantt</h1></div><ModuleSearch title="gantt" value={filterQuery} onChange={setFilterQuery} placeholder="Search streams and items" activeFilters={hideEmptyStreams||statuses.length>0||!showDependencies} onClearFilters={()=>{setHideEmptyStreams(false);setStatuses([]);setShowDependencies(true);dependencyFocus.clear();}}><label className="toggle"><input type="checkbox" checked={hideEmptyStreams} onChange={event=>setHideEmptyStreams(event.target.checked)}/> Hide Empty Streams</label><label className="toggle"><input type="checkbox" checked={!showDependencies} onChange={event=>{setShowDependencies(!event.target.checked);dependencyFocus.clear();}}/> Hide dependencies</label><FilterChoices label="Task Status" options={TASK_STATUSES.map(id=>({id,label:id}))} selected={statuses} onChange={values=>setStatuses(values as TaskStatus[])}/></ModuleSearch><div className="actions">{onModeChange&&<div className="gantt-mode-switch" role="group" aria-label="Gantt mode"><button type="button" className="secondary" aria-pressed={!extended} onClick={()=>onModeChange(false)}>Simple</button><button type="button" className="secondary" aria-pressed={extended} onClick={()=>onModeChange(true)}>Extended</button></div>}<button type="button" className="secondary" onClick={()=>setCollapsedStreams([])}>Expand All</button><button type="button" className="secondary" onClick={()=>setCollapsedStreams(streamGroups.map(group=>group.section.id))}>Collapse All</button></div></PageToolbar><div className="baseline-controls"><BaselineSelector store={store}/><label><input type="checkbox" checked={showBaseline} disabled={!baseline} onChange={e=>setShowBaseline(e.target.checked)}/> Baseline overlay</label><label><input type="checkbox" checked={showVariance} disabled={!baseline} onChange={e=>setShowVariance(e.target.checked)}/> Variance indicators</label><label><input type="checkbox" checked={showDependencies} onChange={e=>{setShowDependencies(e.target.checked);dependencyFocus.clear();}}/> Dependencies</label></div><div className={`gantt ${rowHeight===52?"gantt-with-variance":""} ${showBaseline&&baseline?"gantt-with-baseline":""}`}><div className="gantt-head gantt-item-heading"><button type="button" className="sort-heading" aria-label={`Sort Gantt streams ${sortStreams==="asc"?"descending":"ascending"}`} onClick={()=>setSortStreams(previous=>previous==="asc"?"desc":"asc")}>Item{sortStreams?(sortStreams==="asc"?" ↑":" ↓"):""}</button></div><div className="gantt-head gantt-columns gantt-time-heading"><div className="gantt-years" style={{gridTemplateColumns:`repeat(${model.columns.length},minmax(0,1fr))`}}>{yearSegments.map(segment=><span key={`${segment.year}:${segment.start}`} style={{gridColumn:`${segment.start+1} / span ${segment.count}`}}>{segment.year}</span>)}</div><div className="gantt-dates" style={{gridTemplateColumns:`repeat(${model.columns.length},minmax(0,1fr))`}}>{model.columns.map(column=><span title={`${column.start} – ${column.end}`} className={column.weekend?"weekend":""} key={column.start}>{column.label}</span>)}</div></div><div ref={bodyRef} className="gantt-body">{rows.map((row) => { const bar = barPosition(row.start, row.end, model.start, model.end); const comparison=comparisons.get(`${row.kind}:${row.kind==="milestone"?row.id.split(":")[0]:row.id}`); const historical=showBaseline&&comparison?.baseline?barPosition(comparison.baseline.startDate,comparison.baseline.finishDate,model.start,model.end):null; const delay=showBaseline&&row.kind==="task"?baselineDelayPosition(comparison?.baseline?.finishDate,row.end,model.start,model.end):null; return <div className={`gantt-row ${row.kind} ${focusedConnector&&row.kind!=="section"&&(row.kind!=="task"||![focusedConnector.from,focusedConnector.to].includes(row.id))?"dependency-muted":""}`} data-entity-id={row.id} key={row.id}><div style={{ paddingLeft: `${8 + row.depth * 14}px` }}>{row.kind==="section" ? <><button type="button" className="gantt-open-stream" aria-label={`${collapsedStreams.includes(row.id)?"Expand":"Collapse"} ${row.label}`} aria-expanded={Boolean(needle)||!collapsedStreams.includes(row.id)} onClick={()=>setCollapsedStreams(previous=>previous.includes(row.id)?previous.filter(id=>id!==row.id):[...previous,row.id])}>{!needle&&collapsedStreams.includes(row.id)?"▸":"▾"}</button>{row.id==="project"?<span>{row.label}</span>:<button type="button" className="sort-heading" title={`Open ${row.label} in Streams`} onClick={()=>navigate("Streams",row.id)}>{row.label}</button>}</> : <button type="button" className="sort-heading" title={row.label} onClick={event=>row.kind==="task"?openTaskEditor(row.id,event.currentTarget):navigate("Milestones",row.id.split(":")[0])}>{row.label}</button>}{row.kind === "milestone" && milestoneDependencyIssues(state,row.id.split(":")[0]).length > 0 && <PredictiveDisclosure className="gantt-warning"><summary aria-label={`Dependency warnings for ${row.label}`}>⚠ {milestoneDependencyIssues(state,row.id.split(":")[0]).length}</summary><ul className="anchored-options">{milestoneDependencyIssues(state,row.id.split(":")[0]).map((issue,index)=><li key={index}>{issue}</li>)}</ul></PredictiveDisclosure>}{row.kind !== "section" && <small>{!row.start || !row.end ? "Unscheduled" : bar?.outside ? "Outside visible range" : `${row.start} – ${row.end}`}{row.kind === "task" && showProgress ? ` · ${row.progress}%` : ""}</small>}{showVariance&&baseline&&row.kind!=="section"&&<small className="variance-indicator">{comparison?.status==="Matched"?`Start ${varianceLabel(comparison.startVariance)} · Finish ${varianceLabel(comparison.finishVariance)}`:comparison?.status??"Added"}</small>}</div><div className="gantt-track" style={{ backgroundSize: `${100 / model.columns.length}% 100%` }}>{historical&&!historical.outside&&<div className={`gantt-baseline ${row.kind}`} role="img" aria-label={`Baseline ${row.label}: ${comparison?.baseline?.startDate??"Undated"} to ${comparison?.baseline?.finishDate??"Undated"}`} title={`Baseline: ${comparison?.baseline?.startDate} – ${comparison?.baseline?.finishDate}`} style={{left:`${historical.left}%`,width:`${historical.width}%`}}/>}{bar && !bar.outside && <div className={`gantt-bar ${row.kind}`} data-task-status={row.status} title={row.status?`${row.label} · ${row.status}`:row.label} style={{ backgroundColor:row.kind==="task"?TASK_STATUS_COLOURS[row.status??"Not Started"]:undefined,left: `${bar.left}%`, width: `${bar.width}%` }}>{showProgress&&<i style={{ width: `${row.progress}%` }} />}</div>}{delay&&!delay.outside&&<div className="gantt-delay" role="img" aria-label={`Delayed finish ${row.label}: ${comparison?.finishVariance} days after baseline`} title={`Finish ${comparison?.finishVariance} days after baseline`} style={{left:`${delay.left}%`,width:`${delay.width}%`}}/>}</div></div>; })}<DependencyConnectors activeKey={focusedConnector?.key??null} selectedKey={dependencyFocus.selectedKey} onPreview={dependencyFocus.preview} onSelect={dependencyFocus.select} onClear={dependencyFocus.clear} className="gantt-connectors" height={geometry.height||rows.length * rowHeight} paths={connectors} label={`${connectors.length} visible Finish-to-Start connectors`}/>{editingTaskId&&<form aria-label="Quick edit task" className="gantt-quick-edit" style={editorPosition} onSubmit={event=>{event.preventDefault();saveTask()}}><strong className="quick-edit-heading">Quick edit task</strong><label className="quick-edit-field"><span>Name:</span><HumanTextInput aria-label="Task name" autoFocus required value={draftName} onChange={event=>setDraftName(event.target.value)}/></label><label className="quick-edit-field"><span>Start date:</span><input aria-label="Start date" type="date" value={draftStart} onChange={event=>setDraftStart(event.target.value)}/></label><label className="quick-edit-field"><span>End date:</span><input aria-label="End date" type="date" min={draftStart||undefined} value={draftEnd} onChange={event=>setDraftEnd(event.target.value)}/></label>{draftStart&&draftEnd&&draftEnd<draftStart&&<small role="alert">End date must not precede start date.</small>}<div className="actions"><button type="submit">Save</button><button type="button" className="secondary" onClick={()=>{navigate("Tasks",editingTaskId);setEditingTaskId(null)}}>Open Task</button><button type="button" className="secondary" onClick={()=>setEditingTaskId(null)}>Cancel</button></div></form>}{todayPercent !== null && <TodayMarker left={`calc(clamp(175px, 23%, 275px) + (100% - clamp(175px, 23%, 275px)) * ${todayPercent / 100})`} />}</div><p className="gantt-dependencies">{connectors.length} visible Finish-to-Start connector{connectors.length === 1 ? "" : "s"}</p></div><TimelineNavigation controls={<label className="gantt-zoom-control">Zoom <select aria-label="Zoom" value={zoom} onChange={(event) => { setZoom(event.target.value as GanttZoom); setOffset(0); }}>{["Week", "Month", "Quarter"].map((value) => <option key={value}>{value}</option>)}</select></label>} label="Gantt date navigation" legend={<TimelineStatusLegend kind="task"/>} start={model.start} end={model.end} onPrevious={()=>setOffset(value=>value-1)} onNext={()=>setOffset(value=>value+1)} onToday={()=>setOffset(0)} todayDisabled={false}/></section>;
}
