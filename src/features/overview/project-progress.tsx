"use client";
import { useState } from 'react';
import type { ProjectStore } from '../../application';
import { useProjectState } from '../shell/use-project-state';
import { updateProject } from './project';
export function ProjectProgress({store}:{store:ProjectStore}) {
 const state=useProjectState(store),[draft,setDraft]=useState<string|null>(null);
 const valid=(value:string)=>value.trim()!==''&&Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<=100;
 return <article className="card project-progress-card"><h2>Project Progress (manual)</h2><div className="project-progress-controls">
  <progress aria-label="Project progress" max="100" value={state.project.progress}/>
  <span className="project-progress-number"><input aria-label="Project progress percentage" title="Type a percentage from 0 to 100" type="number" min="0" max="100" step="1" value={draft??state.project.progress} aria-invalid={draft!==null&&draft!==''&&!valid(draft)||undefined}
   onChange={event=>{const value=event.target.value;setDraft(value);if(valid(value))store.execute(updateProject({progress:Number(value)}));}}
   onBlur={()=>setDraft(null)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}}}/><span aria-hidden="true">%</span></span>
 </div></article>;
}
