"use client";
import { useState, type CSSProperties } from "react";
import { useProjectState } from "../shell/use-project-state";
import { editTask } from "../tasks/commands";
import { sortRows } from "../shared/sorting";
import type { ModuleName } from "../shell/shell";
import { milestoneDependencyIssues } from "../milestones/dependencies";
import type { ProjectStore } from "../../application";
import { barPosition, buildGanttModel, type GanttModel, type GanttZoom, positionForDate } from "./model";

export interface GanttConnectorPath { key: string; path: string }
export function ganttConnectorPaths(model: GanttModel): GanttConnectorPath[] {
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
    const fromX = Math.max(0, Math.min(100, positionForDate(from.end, model.start, model.end)));
    const toX = Math.max(0, Math.min(100, positionForDate(to.start, model.start, model.end)));
    const fromY = fromIndex * 36 + 18;
    const toY = toIndex * 36 + 18;
    const elbowX = Math.min(99, Math.max(fromX + 1.25, (fromX + toX) / 2));
    return [{ key: `${dependency.from}:${dependency.to}`, path: `M ${fromX} ${fromY} H ${elbowX} V ${toY} H ${toX}` }];
  });
}

export function GanttView({ store, navigate }: { store: ProjectStore; navigate: (module: ModuleName, entityId?: string) => void }) {
  const [zoom, setZoom] = useState<GanttZoom>("Week");
  const [offset, setOffset] = useState(0);
  const [sortStreams, setSortStreams] = useState<"asc" | "desc" | null>(null);
  const [collapsedStreams, setCollapsedStreams] = useState<string[]>([]);
  const [hideEmptyStreams, setHideEmptyStreams] = useState(false);
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
  const model = buildGanttModel(state, zoom, today, offset, hideEmptyStreams);
  const showProgress = state.project.metadata.showProgress !== false;
  const streamGroups: { section: (typeof model.rows)[number]; items: (typeof model.rows)[number][] }[] = [];
  for (const row of model.rows) {
    if (row.kind === "section") streamGroups.push({section:row,items:[]});
    else streamGroups[streamGroups.length-1]?.items.push(row);
  }
  const projectGroup = streamGroups.filter(group => group.section.id === "project");
  const sortedGroups = sortStreams ? sortRows(streamGroups.filter(group=>group.section.id!=="project"),{key:"label",direction:sortStreams},group=>group.section.label) : streamGroups.filter(group=>group.section.id!=="project");
  const rows = [...projectGroup,...sortedGroups].flatMap(group=>[group.section,...(collapsedStreams.includes(group.section.id)?[]:group.items)]);
  const connectors = ganttConnectorPaths({...model,rows});
  const yearSegments = model.columns.reduce<{year:number;start:number;count:number}[]>((segments,column,index)=>{const year=Number(column.start.slice(0,4));const previous=segments[segments.length-1];if(previous?.year===year)previous.count+=1;else segments.push({year,start:index,count:1});return segments},[]);
  return <section className="panel gantt-panel"><div className="title-row"><div><h1 className="module-page-title">Gantt</h1></div><div className="actions"><details className="chart-filter-menu"><summary>Search / Filter</summary><label className="toggle"><input type="checkbox" checked={hideEmptyStreams} onChange={event=>setHideEmptyStreams(event.target.checked)}/> Hide Empty Streams</label></details><label className="toggle"><input type="checkbox" checked={hideEmptyStreams} onChange={event=>setHideEmptyStreams(event.target.checked)}/> Hide Empty Streams</label><button type="button" className="secondary" onClick={()=>setCollapsedStreams([])}>Expand All</button><button type="button" className="secondary" onClick={()=>setCollapsedStreams(streamGroups.map(group=>group.section.id))}>Collapse All</button><button onClick={() => setOffset((value) => value - 1)}>Previous</button><button onClick={() => setOffset(0)}>Today</button><button onClick={() => setOffset((value) => value + 1)}>Next</button><label className="gantt-zoom-control">Zoom <select value={zoom} onChange={(event) => { setZoom(event.target.value as GanttZoom); setOffset(0); }}>{["Week", "Month", "Quarter"].map((value) => <option key={value}>{value}</option>)}</select></label></div></div><div className="gantt"><div className="gantt-head gantt-item-heading"><button type="button" className="sort-heading" aria-label={`Sort Gantt streams ${sortStreams==="asc"?"descending":"ascending"}`} onClick={()=>setSortStreams(previous=>previous==="asc"?"desc":"asc")}>Item{sortStreams?(sortStreams==="asc"?" ↑":" ↓"):""}</button></div><div className="gantt-head gantt-columns gantt-time-heading"><div className="gantt-years" style={{gridTemplateColumns:`repeat(${model.columns.length},minmax(0,1fr))`}}>{yearSegments.map(segment=><span key={`${segment.year}:${segment.start}`} style={{gridColumn:`${segment.start+1} / span ${segment.count}`}}>{segment.year}</span>)}</div><div className="gantt-dates" style={{gridTemplateColumns:`repeat(${model.columns.length},minmax(0,1fr))`}}>{model.columns.map(column=><span title={`${column.start} – ${column.end}`} className={column.weekend?"weekend":""} key={column.start}>{column.label}</span>)}</div></div>{rows.map((row) => { const bar = barPosition(row.start, row.end, model.start, model.end); return <div className={`gantt-row ${row.kind}`} key={row.id}><div style={{ paddingLeft: `${row.depth * 14}px` }}>{row.kind==="section" ? <><button type="button" className="gantt-open-stream" aria-label={`${collapsedStreams.includes(row.id)?"Expand":"Collapse"} ${row.label}`} aria-expanded={!collapsedStreams.includes(row.id)} onClick={()=>setCollapsedStreams(previous=>previous.includes(row.id)?previous.filter(id=>id!==row.id):[...previous,row.id])}>{collapsedStreams.includes(row.id)?"▸":"▾"}</button>{row.id==="project"?<span>{row.label}</span>:<button type="button" className="sort-heading" title={`Open ${row.label} in Streams`} onClick={()=>navigate("Streams",row.id)}>{row.label}</button>}</> : <button type="button" className="sort-heading" title={row.label} onClick={event=>row.kind==="task"?openTaskEditor(row.id,event.currentTarget):navigate("Milestones",row.id.split(":")[0])}>{row.label}</button>}{row.kind === "milestone" && milestoneDependencyIssues(state,row.id.split(":")[0]).length > 0 && <details className="gantt-warning"><summary aria-label={`Dependency warnings for ${row.label}`}>⚠ {milestoneDependencyIssues(state,row.id.split(":")[0]).length}</summary><ul>{milestoneDependencyIssues(state,row.id.split(":")[0]).map((issue,index)=><li key={index}>{issue}</li>)}</ul></details>}{row.kind !== "section" && <small>{!row.start || !row.end ? "Unscheduled" : bar?.outside ? "Outside visible range" : `${row.start} – ${row.end}`}{row.kind === "task" && showProgress ? ` · ${row.progress}%` : ""}</small>}</div><div className="gantt-track" style={{ backgroundSize: `${100 / model.columns.length}% 100%` }}>{bar && !bar.outside && <div className={`gantt-bar ${row.kind}`} style={{ left: `${bar.left}%`, width: `${bar.width}%` }}>{showProgress&&<i style={{ width: `${row.progress}%` }} />}</div>}</div></div>; })}<svg className="gantt-connectors" viewBox={`0 0 100 ${rows.length * 36}`} preserveAspectRatio="none" aria-label={`${connectors.length} visible Finish-to-Start connectors`}><defs><marker id="gantt-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" /></marker></defs>{connectors.map((connector) => <path key={connector.key} d={connector.path} markerEnd="url(#gantt-arrow)" />)}</svg>{editingTaskId&&<form aria-label="Quick edit task" className="gantt-quick-edit" style={editorPosition} onSubmit={event=>{event.preventDefault();saveTask()}}><strong className="quick-edit-heading">Quick edit task</strong><label className="quick-edit-field"><span>Name:</span><input aria-label="Task name" autoFocus required value={draftName} onChange={event=>setDraftName(event.target.value)}/></label><label className="quick-edit-field"><span>Start date:</span><input aria-label="Start date" type="date" value={draftStart} onChange={event=>setDraftStart(event.target.value)}/></label><label className="quick-edit-field"><span>End date:</span><input aria-label="End date" type="date" min={draftStart||undefined} value={draftEnd} onChange={event=>setDraftEnd(event.target.value)}/></label>{draftStart&&draftEnd&&draftEnd<draftStart&&<small role="alert">End date must not precede start date.</small>}<div className="actions"><button type="submit">Save</button><button type="button" className="secondary" onClick={()=>{navigate("Tasks",editingTaskId);setEditingTaskId(null)}}>Open Task</button><button type="button" className="secondary" onClick={()=>setEditingTaskId(null)}>Cancel</button></div></form>}{today >= model.start && today <= model.end && <div className="today-line" aria-label="Today" style={{ left: `calc(clamp(175px, 23%, 275px) + (100% - clamp(175px, 23%, 275px)) * ${Math.min(1, (positionForDate(today, model.start, model.end) + (50 / model.columns.length)) / 100)})` }} />}<p className="gantt-dependencies">{connectors.length} visible Finish-to-Start connector{connectors.length === 1 ? "" : "s"}</p></div></section>;
}
