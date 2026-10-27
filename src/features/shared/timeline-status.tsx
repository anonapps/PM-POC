import tokens from '../../ui/tokens.json';
import {TASK_STATUSES,MILESTONE_STATUSES,type TaskStatus,type MilestoneStatus} from '../../domain';
export const TASK_STATUS_COLOURS:Record<TaskStatus,string>=tokens.taskStatus;
/** Existing Tube Map colours, now shared with its legend. */
export const MILESTONE_STATUS_COLOURS:Record<MilestoneStatus,string>=tokens.milestoneStatus;
export function TimelineStatusLegend({kind}:{kind:'task'|'milestone'}){
 const statuses=kind==='task'?TASK_STATUSES:MILESTONE_STATUSES;
 return <div role="list" aria-label={`${kind==='task'?'Task':'Milestone'} status legend`} className={`timeline-status-legend ${kind}`}>
 {statuses.map(status=><span role="listitem" key={status}><i aria-hidden="true" style={{backgroundColor:kind==='task'?TASK_STATUS_COLOURS[status as TaskStatus]:MILESTONE_STATUS_COLOURS[status as MilestoneStatus]}}/>{status}</span>)}
 </div>;
}
