"use client";
import { useState } from "react";
import type { ProjectStore } from "../../application";
import { barPosition, buildGanttModel, type GanttModel, type GanttZoom, positionForDate } from "./model";

export interface GanttConnectorPath { key: string; path: string }
export function ganttConnectorPaths(model: GanttModel): GanttConnectorPath[] {
  return model.dependencies.flatMap((dependency) => {
    const fromIndex = model.rows.findIndex((row) => row.kind === "task" && row.id === dependency.from);
    const toIndex = model.rows.findIndex((row) => row.kind === "task" && row.id === dependency.to);
    const from = model.rows[fromIndex];
    const to = model.rows[toIndex];
    if (fromIndex < 0 || toIndex < 0 || !from.end || !to.start) return [];
    const fromX = Math.max(0, Math.min(100, positionForDate(from.end, model.start, model.end)));
    const toX = Math.max(0, Math.min(100, positionForDate(to.start, model.start, model.end)));
    const fromY = fromIndex * 48 + 24;
    const toY = toIndex * 48 + 24;
    const elbowX = Math.min(99, Math.max(fromX + 1.25, (fromX + toX) / 2));
    return [{ key: `${dependency.from}:${dependency.to}`, path: `M ${fromX} ${fromY} H ${elbowX} V ${toY} H ${toX}` }];
  });
}

export function GanttView({ store }: { store: ProjectStore }) {
  const [zoom, setZoom] = useState<GanttZoom>("Week");
  const [offset, setOffset] = useState(0);
  const today = new Date().toISOString().slice(0, 10);
  const model = buildGanttModel(store.getState(), zoom, today, offset);
  const connectors = ganttConnectorPaths(model);
  return <section className="panel gantt-panel"><div className="title-row"><div><p className="eyebrow">Detailed planning</p><h1>Gantt</h1></div><div className="actions"><button onClick={() => setOffset((value) => value - 1)}>Previous</button><button onClick={() => setOffset(0)}>Today</button><button onClick={() => setOffset((value) => value + 1)}>Next</button><label>Zoom <select value={zoom} onChange={(event) => { setZoom(event.target.value as GanttZoom); setOffset(0); }}>{["Week", "Month", "Quarter"].map((value) => <option key={value}>{value}</option>)}</select></label></div></div><div className="gantt"><div className="gantt-head">Item</div><div className="gantt-head gantt-columns">{model.columns.map((column) => <span className={column.weekend ? "weekend" : ""} key={column.start}>{column.label}</span>)}</div>{model.rows.map((row) => { const bar = barPosition(row.start, row.end, model.start, model.end); return <div className={`gantt-row ${row.kind}`} key={row.id}><div style={{ paddingLeft: `${row.depth * 14}px` }}><strong>{row.label}</strong>{row.kind !== "section" && <small>{!row.start || !row.end ? "Unscheduled" : bar?.outside ? "Outside visible range" : `${row.start} – ${row.end}`}{row.kind === "task" ? ` · ${row.progress}%` : ""}</small>}</div><div className="gantt-track">{bar && !bar.outside && <div className={`gantt-bar ${row.kind}`} style={{ left: `${bar.left}%`, width: `${bar.width}%` }}><i style={{ width: `${row.progress}%` }} /></div>}</div></div>; })}<svg className="gantt-connectors" viewBox={`0 0 100 ${model.rows.length * 48}`} preserveAspectRatio="none" aria-label={`${connectors.length} visible Finish-to-Start connectors`}><defs><marker id="gantt-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 z" /></marker></defs>{connectors.map((connector) => <path key={connector.key} d={connector.path} markerEnd="url(#gantt-arrow)" />)}</svg><div className="today-line" style={{ left: `calc(32% + (68% * ${positionForDate(today, model.start, model.end) / 100}))` }} /><p className="gantt-dependencies">{connectors.length} visible Finish-to-Start connector{connectors.length === 1 ? "" : "s"}</p></div></section>;
}
