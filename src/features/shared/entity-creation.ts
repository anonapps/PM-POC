import type { ProjectCommand, ProjectState } from '../../application';
import { TASK_STATUSES, LIFECYCLE_STATUSES, MILESTONE_STATUSES, PRIORITIES, RISK_STATUSES, RISK_RATINGS, type TaskStatus, type LifecycleStatus, type Priority, type MilestoneStatus, type RiskRating, type RiskStatus, type RiskAction } from '../../domain';
import { createPerson,createStream } from '../resources/commands';
import { createTask,validateTaskDraft } from '../tasks/commands';
import { createMilestone,validateMilestone } from '../milestones/commands';
import { createRisk,validateRisk } from '../risks/commands';
import { createDecision,validateDecision } from '../decisions/commands';
import { capitaliseFirstLetter } from './text-normalisation';
import { isCalendarDate } from './creation-validation';
export type CreationKind='person'|'stream'|'task'|'milestone'|'risk'|'decision';
export const creationNames:Record<CreationKind,string>={person:'Person',stream:'Stream',task:'Task',milestone:'Milestone',risk:'Risk',decision:'Decision'};
export const creationLabels:Record<CreationKind,string>={person:'Person name',stream:'Stream name',task:'Task name',milestone:'Name',risk:'Risk title',decision:'Title'};
export const creationIds:Record<CreationKind,string>={person:'new-person-name',stream:'new-stream-name',task:'new-task-name',milestone:'new-milestone-name',risk:'new-risk-title',decision:'new-decision-title'};
export interface CreationDraft {
 name:string;description:string;role:string;notes:string;date:string;startDate:string;endDate:string;dueDate:string;ownerId:string;status:string;priority:string;progress:string;
 scopeId:string;parentTaskId:string;milestoneId:string;projectWide:boolean;streamIds:string[];taskIds:string[];milestoneIds:string[];riskIds:string[];predecessors:string[];probability:string;impact:string;actions:Omit<RiskAction,'id'>[];
}
export function initialCreationDraft(kind:CreationKind):CreationDraft{return {name:'',description:'',role:'',notes:'',date:'',startDate:'',endDate:'',dueDate:'',ownerId:'',status:kind==='milestone'?'Tentative':kind==='risk'?'Open':'Not Started',priority:'',progress:'0',scopeId:'',parentTaskId:'',milestoneId:'',projectWide:kind!=='decision',streamIds:[],taskIds:[],milestoneIds:[],riskIds:[],predecessors:[],probability:'Low',impact:'Low',actions:[]};}
export function creationIsDirty(kind:CreationKind,draft:CreationDraft){return JSON.stringify(draft)!==JSON.stringify(initialCreationDraft(kind));}
/** All fields are transient until a single existing canonical creation command succeeds. */
export function prepareCreation(kind:CreationKind,d:CreationDraft,state:ProjectState):{errors:Record<string,string>;command?:ProjectCommand}{
 const errors:Record<string,string>={};if(!d.name.trim())errors.name=`${creationLabels[kind]} is required.`;
 if(kind==='milestone'||kind==='decision'){if(!d.date)errors.date=`${kind==='decision'?'Decision date':'Date'} is required.`;else if(!isCalendarDate(d.date))errors.date='Enter a valid date.';}
 for(const field of ['startDate','endDate','dueDate'] as const)if(d[field]&&!isCalendarDate(d[field]))errors[field]='Enter a valid date.';
 if(d.startDate&&d.endDate&&d.endDate<d.startDate)errors.endDate='End date must be on or after start date.';
 const statusOptions=kind==='milestone'?MILESTONE_STATUSES:kind==='risk'?RISK_STATUSES:kind==='task'?TASK_STATUSES:LIFECYCLE_STATUSES;
 if(['stream','task','milestone','risk'].includes(kind)&&!(statusOptions as readonly string[]).includes(d.status))errors.status='Select a valid status.';
 if(d.priority&&!(PRIORITIES as readonly string[]).includes(d.priority))errors.priority='Select a valid priority.';
 if(d.ownerId&&!state.people.some(p=>p.id===d.ownerId&&!p.deletion.isDeleted))errors.ownerId='Select an active owner.';
 if(kind==='person'){if(capitaliseFirstLetter(d.role).length>500)errors.role='Role must be at most 500 characters.';if(capitaliseFirstLetter(d.notes).length>20000)errors.notes='Notes must be at most 20,000 characters.';}
 const links={ownerId:d.ownerId||null,projectWide:d.projectWide,relatedStreamIds:d.projectWide&&kind==='decision'?[]:d.streamIds,relatedTaskIds:d.taskIds,relatedMilestoneIds:d.projectWide&&kind==='decision'?[]:d.milestoneIds};
 const priority=d.priority?d.priority as Priority:undefined;let command:ProjectCommand;let messages:readonly string[]=[];
 if(kind==='person')command=createPerson(d.name,{role:d.role||undefined,notes:d.notes||undefined});
 else if(kind==='stream')command=createStream({name:d.name,description:d.description||undefined,ownerId:links.ownerId,status:d.status as LifecycleStatus,priority,startDate:d.startDate||null,endDate:d.endDate||null});
 else if(kind==='task'){
  const draft={name:d.name,description:d.description||undefined,scope:d.scopeId?{kind:'stream' as const,streamId:d.scopeId}:{kind:'project' as const},ownerId:links.ownerId,status:d.status as TaskStatus,progress:Number(d.progress),priority,startDate:d.startDate||null,endDate:d.endDate||null,parentTaskId:d.parentTaskId||undefined,milestoneId:d.milestoneId||undefined,predecessorTaskIds:d.predecessors};
  if(d.parentTaskId&&!state.tasks.some(t=>t.id===d.parentTaskId&&!t.deletion.isDeleted))errors.parentTaskId='Select an active parent task.';
  if(d.milestoneId&&!state.milestones.some(m=>m.id===d.milestoneId&&!m.deletion.isDeleted))errors.milestoneId='Select an active milestone.';
  if(!d.progress.trim()||!Number.isInteger(Number(d.progress))||Number(d.progress)<0||Number(d.progress)>100)errors.progress='Progress must be a whole number from 0 to 100.';
  messages=validateTaskDraft(state,draft);command=createTask(draft);
 }else if(kind==='milestone'){
  if(!d.projectWide&&!d.streamIds.length)errors.streamIds='Select at least one Stream or Project-wide.';
  const draft={name:d.name,description:d.description||undefined,plannedDate:d.date,ownerId:links.ownerId,status:d.status as MilestoneStatus,priority,scope:d.projectWide?{kind:'project' as const}:{kind:'streams' as const,streamIds:d.streamIds},relatedTaskIds:d.taskIds,predecessors:d.predecessors.map(value=>{const [kind,id]=value.split(':');return {kind:kind as 'task'|'milestone',id};})};
  messages=validateMilestone(state,draft);command=createMilestone(draft);
 }else if(kind==='risk'){
  const draft={title:d.name,description:d.description||undefined,status:d.status as RiskStatus,probability:d.probability as RiskRating,impact:d.impact as RiskRating,dueDate:d.dueDate||undefined,...links};
  if(!RISK_RATINGS.includes(d.probability as RiskRating)||!RISK_RATINGS.includes(d.impact as RiskRating))errors._form='Select valid probability and impact.';
  if(d.actions.some(a=>!a.description.trim()||!['Open','Complete'].includes(a.status)||(a.dueDate&&!isCalendarDate(a.dueDate))))errors.actions='Each action needs a description and valid optional date.';
  messages=validateRisk(state,draft);command=createRisk(draft,d.actions);
 }else{const draft={title:d.name,description:d.description||undefined,decisionDate:d.date,...links,relatedRiskIds:d.riskIds};messages=validateDecision(state,draft);command=createDecision(draft);}
 if(messages.length&&!Object.keys(errors).length)errors._form=messages.join(' ');
 return Object.keys(errors).length?{errors}:{errors,command};
}
