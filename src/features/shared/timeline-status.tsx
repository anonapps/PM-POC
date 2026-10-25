import {TASK_STATUSES,MILESTONE_STATUSES,type TaskStatus,type MilestoneStatus} from '../../domain';
export const TASK_STATUS_COLOURS:Record<TaskStatus,string>={Tentative:'#9d8ab8','Not Started':'#a0adbd','In Progress':'#6b97c4','On Hold':'#c4a36c',Completed:'#7ca58a',Cancelled:'#bb8585'};
/** Existing Tube Map colours, now shared with its legend. */
export const MILESTONE_STATUS_COLOURS:Record<MilestoneStatus,string>={Tentative:'#93c5fd',Planned:'#7c3aed',Delayed:'#fca5a5',Complete:'#16a34a'};
export function TimelineStatusLegend({kind}:{kind:'task'|'milestone'}){
 const statuses=kind==='task'?TASK_STATUSES:MILESTONE_STATUSES;
 return <div role="list" aria-label={`${kind==='task'?'Task':'Milestone'} status legend`} className={`timeline-status-legend ${kind}`}>
 {statuses.map(status=><span role="listitem" key={status}><i aria-hidden="true" style={{backgroundColor:kind==='task'?TASK_STATUS_COLOURS[status as TaskStatus]:MILESTONE_STATUS_COLOURS[status as MilestoneStatus]}}/>{status}</span>)}
 </div>;
}
