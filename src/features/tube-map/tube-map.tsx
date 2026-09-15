"use client";
import { useState } from "react";
import type { ProjectStore } from "../../application";
import { EmptyState, Status } from "../shell/shell";
import { buildTubeMap } from "./model";

export function TubeMapView({ store }: { store: ProjectStore }) {
  const [labels, setLabels] = useState<"week" | "date">("week"); const model = buildTubeMap(store.getState());
  if (!model.streams.length) return <section className="panel"><h1>Tube Map</h1><EmptyState title="No roadmap lines" description="Add active streams and milestones to build the roadmap." /></section>;
  return <section className="panel"><div className="title-row"><div><p className="eyebrow">12-week governance roadmap</p><h1>Tube Map</h1></div><label className="toggle">Axis <select value={labels} onChange={(event) => setLabels(event.target.value as typeof labels)}><option value="week">Week number</option><option value="date">Monday date</option></select></label></div><div className="tube-map" aria-label={`Roadmap from ${model.start} to ${model.end}`}><div className="tube-axis">{model.weeks.map((week) => <span key={week.date}>{labels === "week" ? week.label : week.date}</span>)}</div>{model.streams.map((stream) => <div className={`tube-line lane-${stream.lane % 5}`} key={stream.id}><strong>{stream.label}</strong><div /></div>)}{model.stations.filter((station) => station.boundary === "inside").map((station) => <button key={station.id} className="tube-station" style={{ left: `calc(140px + (100% - 160px) * ${station.x / 100})`, top: `${64 + (station.lanes[0] ?? 0) * 62}px` }} title={`${station.label}: ${station.date}, ${station.status}`}><i />{station.label}<small>{station.date} · {station.lanes.length > 1 ? `${station.lanes.length} streams` : station.status}</small></button>)}<footer><Status>{model.connections.length} milestone connections</Status>{model.stations.filter((station) => station.boundary !== "inside").length} stations outside this window</footer></div></section>;
}
