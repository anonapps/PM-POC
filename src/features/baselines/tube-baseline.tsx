"use client";
import type { ProjectBaseline } from "../../domain/baselines";
import type { ProjectState } from "../../application";
import type { HistoricalLane, HistoricalStation } from "../tube-map/baseline-model";
import type { TubeMapModel } from "../tube-map/model";
import { milestoneTooltip, useTubeTooltip } from "../tube-map/milestone-tooltip";

function Indicator({station,baseline,state,showNames,top}:{station:HistoricalStation;baseline:ProjectBaseline;state:ProjectState;showNames:boolean;top:number}) {
 const item=station.row.baseline!,tooltip=useTubeTooltip(milestoneTooltip(state,station.row,true,baseline.snapshot.streams));
 return <span {...tooltip.events} data-baseline-id={item.id} className={`tube-baseline-indicator ${station.x>50?"label-left":"label-right"}`} role="img" tabIndex={0} aria-label={`${item.humanId} · ${item.name} · Baseline ${item.finishDate}`} style={{left:`${station.x}%`,top:`${top}px`}}><span aria-hidden="true">◇</span>{showNames&&<small className="tube-baseline-name">{item.name}</small>}</span>;
}

/** Same colourless historical strip, optionally placed in each main-map lane. */
export function TubeBaselineStrip({baseline,state,lanes,showNames,overlay}:{baseline:ProjectBaseline;state:ProjectState;lanes:readonly HistoricalLane[];showNames:boolean;overlay?:TubeMapModel}) {
 if(overlay)return <div className="tube-baseline-overlay" role="region" aria-label="Baseline milestone indicators">{lanes.flatMap(lane=>{
  const stream=overlay.streams.find(stream=>stream.id===lane.id);if(!stream)return [];
  return lane.stations.map(station=><Indicator key={`${lane.id}:${station.row.key}`} station={station} baseline={baseline} state={state} showNames={showNames} top={stream.top+stream.contentHeight+station.y}/>);
 })}</div>;
 return <section className={`tube-baseline-strip ${showNames?"":"names-hidden"}`} aria-label="Baseline milestone indicators"><h2>Baseline milestones · {baseline.name}</h2>{lanes.map(lane=><div className="tube-baseline-lane" key={lane.id}><span>{lane.label}</span><div style={{height:`${lane.height}px`}}>{lane.stations.map(station=><Indicator key={station.row.key} station={station} baseline={baseline} state={state} showNames={showNames} top={station.y}/>)}</div></div>)}</section>;
}
