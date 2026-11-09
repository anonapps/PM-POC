"use client";
import { compareSchedule, type ProjectBaseline } from '../../domain/baselines';
import type { ProjectState } from '../../application';
import { milestoneTooltip, useTubeTooltip } from '../tube-map/milestone-tooltip';
import type { buildTubeBaselineOverlay, TubeBaselineMarker } from './tube-baseline-overlay';

function Marker({marker,baseline,state}:{marker:TubeBaselineMarker;baseline:ProjectBaseline;state:ProjectState}) {
  const rows=compareSchedule(baseline.snapshot,state).filter(row=>row.baseline?.kind==='milestone'&&marker.milestoneIds.includes(row.baseline.id));
  const tooltip=useTubeTooltip(<>{rows.map(row=><div key={row.key} className="tube-tooltip-group">{milestoneTooltip(state,row,true,baseline.snapshot.streams)}</div>)}</>);
  const label=marker.descriptions.join('; ');
  return <span {...tooltip.events} role="img" tabIndex={0} aria-label={label} data-baseline-id={marker.milestoneIds[0]} data-stream-id={marker.streamId} data-baseline-date={marker.date}
    className={`tube-baseline-overlay-marker${marker.x > 80 ? " label-left" : ""}`} style={{left:`${marker.x}%`,top:marker.y}}>
    <span aria-hidden="true">◇{marker.descriptions.length>1&&<sup>{marker.descriptions.length}</sup>}</span>
  </span>;
}
export function TubeBaselineOverlay({overlay,baseline,state}:{overlay:ReturnType<typeof buildTubeBaselineOverlay>;baseline:ProjectBaseline;state:ProjectState}) {
  return <>
    {overlay.extraStreams.map(stream=><div className="tube-line tube-baseline-only-line" key={stream.id} style={{top:stream.top,height:stream.height}}><span className="tube-baseline-only-label">{stream.label}</span><div/></div>)}
    {overlay.markers.map(marker=><Marker key={`${marker.streamId}:${marker.date}`} marker={marker} baseline={baseline} state={state}/>)}
  </>;
}
