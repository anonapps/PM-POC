"use client";
import { Tooltip } from '@heroui/react';
import type { ScheduleComparison } from '../../domain/baselines';
import { timelineDisplayDate } from '../shared/timeline-date';

/** Read-only historical bar with the complete comparison available to pointer and keyboard users. */
export function GanttBaselineMarker({name,kind,comparison,left,width}:{name:string;kind:string;comparison:ScheduleComparison;left:number;width:number}) {
  const date=(value:string|null|undefined)=>value?timelineDisplayDate(value):'Undated';
  const content=<div className="gantt-baseline-tooltip"><strong>{name}</strong>
    <span>Current start: {date(comparison.current?.startDate)}</span><span>Current end: {date(comparison.current?.finishDate)}</span>
    <span>Baseline start: {date(comparison.baseline?.startDate)}</span><span>Baseline end: {date(comparison.baseline?.finishDate)}</span>
  </div>;
  return <Tooltip content={content} delay={300} closeDelay={0} disableAnimation placement="top" shouldFlip classNames={{base:'action-tooltip-layer',content:'app-tooltip action-tooltip'}}>
    <div className={`gantt-baseline ${kind}`} role="img" tabIndex={0} aria-label={`Baseline ${name}: ${comparison.baseline?.startDate??'Undated'} to ${comparison.baseline?.finishDate??'Undated'}`} style={{left:`${left}%`,width:`${width}%`}}/>
  </Tooltip>;
}
