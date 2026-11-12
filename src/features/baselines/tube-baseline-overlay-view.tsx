"use client";
import { useLayoutEffect, useRef } from 'react';
import { compareSchedule, type ProjectBaseline } from '../../domain/baselines';
import type { ProjectState } from '../../application';
import { milestoneTooltip, useTubeTooltip } from '../tube-map/milestone-tooltip';
import { historicalMarkerCentre, type buildTubeBaselineOverlay, type TubeBaselineMarker } from './tube-baseline-overlay';

function Marker({marker,baseline,state}:{marker:TubeBaselineMarker;baseline:ProjectBaseline;state:ProjectState}) {
  const ref=useRef<HTMLSpanElement>(null);
  useLayoutEffect(()=>{
    const node=ref.current,body=node?.parentElement;
    if(!node||!body)return;
    const place=()=>{
      node.style.transform='translate(-50%,-50%)';
      const box=node.getBoundingClientRect(),bounds=body.getBoundingClientRect();
      const obstacles=[...body.querySelectorAll<HTMLElement>('.tube-station-diamond,.tube-station-link,.tube-baseline-overlay-marker')]
        .filter(other=>other!==node && (!other.matches('.tube-baseline-overlay-marker') || !!(other.compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING)))
        .map(other=>other.getBoundingClientRect()).filter(other=>other.top<box.bottom && other.bottom>box.top);
      const anchor=box.left+box.width/2;
      const centre=historicalMarkerCentre(anchor,box.width/2,obstacles,bounds.left,bounds.right);
      node.style.transform=`translate(calc(-50% + ${centre-anchor}px),-50%)`;
    };
    place();
    const observer=new ResizeObserver(place);observer.observe(body);
    return()=>observer.disconnect();
  },[marker,state]);
  const rows=compareSchedule(baseline.snapshot,state).filter(row=>row.baseline?.kind==='milestone'&&marker.milestoneIds.includes(row.baseline.id));
  const tooltip=useTubeTooltip(<>{rows.map(row=><div key={row.key} className="tube-tooltip-group">{milestoneTooltip(state,row,true,baseline.snapshot.streams)}</div>)}</>);
  const label=marker.descriptions.join('; ');
  return <span ref={ref} {...tooltip.events} role="img" tabIndex={0} aria-label={label} data-baseline-id={marker.milestoneIds[0]} data-stream-id={marker.streamId} data-baseline-date={marker.date}
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
