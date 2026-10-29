"use client";
import { ActionButton } from "./action-button";
import { useState, type ReactNode, type ChangeEvent } from 'react';
import type { ProjectStore } from '../../application';
import { TASK_STATUSES,LIFECYCLE_STATUSES,MILESTONE_STATUSES,PRIORITIES,RISK_STATUSES,RISK_RATINGS } from '../../domain';
import { isCalendarDate } from './creation-validation';
import { Dialog } from '../shell/shell';
import { useProjectState } from '../shell/use-project-state';
import { HumanTextInput,HumanTextArea } from './human-text';
import { FormField,FieldMessage } from './form-field';
import { RelationshipPicker } from './relationship-picker';
import { SearchableOwnerSelect } from './searchable-owner-select';
import { PredictiveSelect } from './predictive-select';
import { ScopePill } from './scope-pill';
import { creationIds,creationLabels,creationNames,creationIsDirty,initialCreationDraft,prepareCreation,type CreationDraft,type CreationKind } from './entity-creation';

export function EntityCreationPanel({kind,store,onClose,onCreated}:{kind:CreationKind;store:ProjectStore;onClose:()=>void;onCreated:()=>void}){
 const state=useProjectState(store),[draft,setDraft]=useState(()=>initialCreationDraft(kind)),[errors,setErrors]=useState<Record<string,string>>({}),[confirm,setConfirm]=useState(false);
 const update=<K extends keyof CreationDraft>(key:K,value:CreationDraft[K])=>setDraft(previous=>({...previous,[key]:value}));
 const id=(key:string)=>key==='name'?creationIds[kind]:`${creationIds[kind]}-${key}`;
 const text=(key:'name'|'description'|'role'|'notes'|'date'|'startDate'|'endDate'|'dueDate'|'progress',label:string,{required=false,multiline=false,date=false,number=false}={})=>{
  const props={id:id(key),'aria-label':label,'aria-required':required||undefined,'aria-invalid':Boolean(errors[key]),'aria-describedby':`${id(key)}-error`,value:draft[key],onChange:(event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>update(key,event.target.value)};
  return <FormField label={label} required={required} className={`creation-field creation-field--${key} ${multiline?'wide-field':''}`} errorId={`${id(key)}-error`} error={errors[key]}>{multiline?<HumanTextArea {...props} rows={3}/>:<HumanTextInput {...props} type={date?'date':number?'number':'text'}/>}</FormField>;
 };
 const select=(key:'status'|'priority'|'probability'|'impact',label:string,options:readonly string[],empty=false)=><FormField label={label} className="creation-field" errorId={`${id(key)}-error`} error={errors[key]} announceError={false}><select aria-label={label} value={draft[key]} onChange={e=>update(key,e.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={`${id(key)}-error`}>{empty&&<option value="">None</option>}{options.map(value=><option key={value}>{value}</option>)}</select></FormField>;
 const relationship=(label:string,items:Parameters<typeof RelationshipPicker>[0]['items'],key:'streamIds'|'taskIds'|'milestoneIds'|'riskIds'|'predecessors')=><div className="creation-relationship"><RelationshipPicker id={id(key)} error={errors[key]} label={label} items={items} selected={draft[key]} onChange={values=>update(key,values)}/><FieldMessage id={`${id(key)}-error`} error={errors[key]}/></div>;
 const activeTasks=state.tasks.filter(t=>!t.deletion.isDeleted),activeMilestones=state.milestones.filter(m=>!m.deletion.isDeleted);
 const single=(key:'scopeId'|'parentTaskId'|'milestoneId',label:string,items:readonly {id:string;name:string;humanId?:string}[],empty='None')=><div className="creation-selector"><span>{label}</span><PredictiveSelect label={label} value={draft[key]} options={[{id:'',name:empty},...items]} renderValue={key==='scopeId'?<ScopePill name={draft.scopeId?state.streams.find(s=>s.id===draft.scopeId)?.name??'Unavailable stream':'Project-wide'}/>:undefined} onChange={value=>{if(key==='parentTaskId'&&value){const parent=activeTasks.find(t=>t.id===value)!;setDraft(old=>({...old,parentTaskId:value,scopeId:parent.scope.kind==='stream'?parent.scope.streamId:''}));}else update(key,value);}}/><FieldMessage error={errors[key]} announce={false}/></div>;
 const owner=<div className="creation-selector"><span>Owner</span><SearchableOwnerSelect label="Owner" value={draft.ownerId} people={state.people.filter(p=>!p.deletion.isDeleted)} onChange={value=>update('ownerId',value)}/><FieldMessage error={errors.ownerId} announce={false}/></div>;
 const projectWide=<label className="toggle"><input type="checkbox" checked={draft.projectWide} onChange={e=>{setDraft(old=>({...old,projectWide:e.target.checked,...(kind==='decision'&&e.target.checked?{streamIds:[],milestoneIds:[]}:{} )}));}}/>Project-wide{kind==='decision'?' (exclusive)':''}</label>;
 const context:ReactNode=<div className="creation-relations wide-field">{projectWide}{(!draft.projectWide||kind==='risk')&&relationship('Streams',state.streams,'streamIds')}{relationship('Tasks',state.tasks,'taskIds')}{(!draft.projectWide||kind==='risk')&&relationship('Milestones',state.milestones,'milestoneIds')}{kind==='decision'&&relationship('Risks',state.risks,'riskIds')}</div>;
 const dismiss=()=>{if(creationIsDirty(kind,draft))setConfirm(true);else onClose();};
 const submit=()=>{const result=prepareCreation(kind,draft,store.getState());setErrors(result.errors);if(!result.command){const key=Object.keys(result.errors)[0];if(key==='actions'){const index=draft.actions.findIndex(a=>!a.description.trim()||(a.dueDate&&!isCalendarDate(a.dueDate)));document.getElementById(`${id('actions')}-${index}${draft.actions[index]?.description.trim()?'-date':''}`)?.focus();}else document.getElementById(id(key))?.focus();return;}if(store.execute(result.command)){onCreated();onClose();}else setErrors({_form:'Unable to create. Review the fields and relationships.'});};
 return <><Dialog title={`Create ${creationNames[kind]}`} variant="creation" initialFocusId={creationIds[kind]} onClose={dismiss}>
  <form data-create-draft="true" data-dirty={creationIsDirty(kind,draft)} noValidate onSubmit={e=>{e.preventDefault();submit();}} onKeyDown={e=>{if(e.key==='Enter'&&e.target instanceof HTMLInputElement&&!e.target.closest('.searchable-option-list')&&e.target.type!=='checkbox'&&e.target.type!=='radio'){e.preventDefault();e.currentTarget.requestSubmit();}}}>
   <div className={`creation-fields creation-fields--${kind}`}><p className="muted wide-field">Fields marked * are required.</p>
    {text('name',creationLabels[kind],{required:true})}
    {(kind==='milestone'||kind==='decision')&&text('date',kind==='decision'?'Decision date':'Date',{required:true,date:true})}
    {kind==='person'?<>{text('role','Role')}{text('notes','Notes',{multiline:true})}</>:<>
     {text('description',kind==='decision'?'Additional information':'Description',{multiline:true})}{owner}
     {kind!=='decision'&&select('status','Status',kind==='milestone'?MILESTONE_STATUSES:kind==='risk'?RISK_STATUSES:kind==='task'?TASK_STATUSES:LIFECYCLE_STATUSES)}
     {['stream','task','milestone'].includes(kind)&&select('priority','Priority',PRIORITIES,true)}
     {(kind==='stream'||kind==='task')&&<>{text('startDate','Start date',{date:true})}{text('endDate','End date',{date:true})}</>}
     {kind==='task'&&<>{single('scopeId','Scope',state.streams.filter(s=>!s.deletion.isDeleted),'Project-wide')}{single('parentTaskId','Parent task',activeTasks)}{single('milestoneId','Milestone',activeMilestones)}{text('progress','Progress',{number:true})}{relationship('Predecessor tasks',activeTasks,'predecessors')}</>}
     {kind==='milestone'&&<div className="creation-relations wide-field">{projectWide}{!draft.projectWide&&relationship('Streams',state.streams,'streamIds')}{relationship('Related tasks',state.tasks,'taskIds')}{relationship('Predecessors',[...activeTasks.map(t=>({...t,id:`task:${t.id}`})),...activeMilestones.map(m=>({...m,id:`milestone:${m.id}`}))],'predecessors')}</div>}
     {(kind==='risk'||kind==='decision')&&context}
     {kind==='risk'&&<>{select('probability','Probability',RISK_RATINGS)}{select('impact','Impact',RISK_RATINGS)}{text('dueDate','Due date',{date:true})}<div className="creation-actions wide-field"><strong>Risk actions</strong>{draft.actions.map((action,index)=><div className="creation-action" key={index}><label>Action description<HumanTextArea id={`${id('actions')}-${index}`} aria-invalid={Boolean(errors.actions)&&!action.description.trim()} aria-describedby={`${id('actions')}-error`} aria-label={`Action description ${index+1}`} rows={2} value={action.description} onChange={e=>update('actions',draft.actions.map((a,i)=>i===index?{...a,description:e.target.value}:a))}/></label><label>Action status<select aria-label={`Action status ${index+1}`} value={action.status} onChange={e=>update('actions',draft.actions.map((a,i)=>i===index?{...a,status:e.target.value as 'Open'|'Complete'}:a))}><option>Open</option><option>Complete</option></select></label><label>Action due date<input id={`${id('actions')}-${index}-date`} aria-describedby={`${id('actions')}-error`} aria-label={`Action due date ${index+1}`} type="date" value={action.dueDate??''} onChange={e=>update('actions',draft.actions.map((a,i)=>i===index?{...a,dueDate:e.target.value||undefined}:a))}/></label><ActionButton type="button" variant="secondary" onClick={()=>update('actions',draft.actions.filter((_,i)=>i!==index))}>Remove action</ActionButton></div>)}<ActionButton type="button" variant="secondary" onClick={()=>update('actions',[...draft.actions,{description:'',status:'Open'}])}>Add action</ActionButton><FieldMessage id={`${id('actions')}-error`} error={errors.actions}/></div></>}
    </>}
   </div>
   <div className="creation-footer"><FieldMessage error={errors._form}/><div className="actions"><ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton><ActionButton type="submit">Create</ActionButton></div></div>
  </form>
 </Dialog>{confirm&&<Dialog title="Discard unsaved changes?" onClose={()=>setConfirm(false)}><p>The creation panel has unsaved values. Discard them or stay to continue editing.</p><div className="form-actions"><ActionButton type="button" variant="secondary" onClick={()=>setConfirm(false)}>Stay</ActionButton><ActionButton type="button" onClick={onClose}>Discard</ActionButton></div></Dialog>}</>;
}
