"use client";
import { useState } from "react";
import type { ProjectStore } from "../../application";
import { EmptyState, Status } from "../shell/shell";
import { barPosition, buildGanttModel } from "./model";

const zooms = ["Day", "Week", "Month", "Quarter"] as const;
export function GanttView({ store }: { store: ProjectStore }) {
  const [zoom, setZoom] = useState<(typeof zooms)[number]>("Week");
  const model = buildGanttModel(store.getState());
  return <section className="panel"><div className="title-row"><div><p className="eyebrow">Detailed planning</p><h1>Gantt</h1></div><label className="toggle">Zoom <select value={zoom} onChange={(event) => setZoom(event.target.value as typeof zoom)}>{zooms.map((value) => <option key={value}>{value}</option>)}</select></label></div>{model.rows.length === 0 ? <EmptyState title="Nothing to schedule" description="Add dated streams, tasks, or milestones to populate the Gantt." /> : <div className="gantt" aria-label={`Gantt timeline from ${model.start} to ${model.end}`}><div className="gantt-head">Item</div><div className="gantt-head timeline-label"><span>{model.start}</span><span>{model.end}</span></div>{model.rows.map((row) => { const bar = barPosition(row.start, row.end, model.start, model.end); return <div className="gantt-row" key={row.id}><div style={{ paddingLeft: `${row.depth * 14}px` }}><Status>{row.kind}</Status> {row.label}<small>{row.start ? `${row.start}${row.end !== row.start ? ` – ${row.end}` : ""}` : "Unscheduled"}</small></div><div className="gantt-track">{bar && <div className={`gantt-bar ${row.kind}`} style={{ left: `${bar.left}%`, width: `${bar.width}%` }} aria-label={`${row.label}, ${row.start} to ${row.end}, ${row.progress ?? "not applicable"}% progress`}><i style={{ width: `${row.progress ?? 0}%` }} /></div>}</div></div>})}<p className="gantt-dependencies">{model.dependencies.length} active dependencies shown in this view.</p></div>}</section>;
}
