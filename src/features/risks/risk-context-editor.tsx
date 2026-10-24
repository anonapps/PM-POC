"use client";
import { HumanTextArea } from "../shared/human-text";
import { useState } from "react";
import type { Risk } from "../../domain";
import type { ProjectState, ProjectStore } from "../../application";
import { RelationshipPicker } from "../shared/relationship-picker";
import { SearchableOwnerSelect } from "../shared/searchable-owner-select";
import { editRisk, validateRisk } from "./commands";
export function RiskContextEditor({risk,state,store,onClose}:{risk:Risk;state:ProjectState;store:ProjectStore;onClose:()=>void}) {
  const [error,setError]=useState("");
  const [draft,setDraft]=useState({description:risk.description??"",ownerId:risk.ownerId,projectWide:risk.projectWide,relatedStreamIds:[...risk.relatedStreamIds],relatedTaskIds:[...risk.relatedTaskIds],relatedMilestoneIds:[...risk.relatedMilestoneIds]});
  return <form className="risk-context-editor" aria-label={`Context for ${risk.humanId}`} aria-describedby={error?`risk-context-error-${risk.id}`:undefined} onSubmit={event=>{event.preventDefault();const errors=validateRisk(store.getState(),{...risk,...draft});if(errors.length){setError(errors.join(" "));return;}store.execute(editRisk(risk.id,draft));onClose();}} onKeyDown={event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();event.currentTarget.requestSubmit();}}}>
    <SearchableOwnerSelect label={`Owner for ${risk.humanId}`} value={draft.ownerId??""} people={state.people.filter(person=>!person.deletion.isDeleted||person.id===draft.ownerId).map(person=>({...person,deleted:person.deletion.isDeleted}))} onChange={id=>setDraft(previous=>({...previous,ownerId:id||null}))}/>
    <label><input type="checkbox" checked={draft.projectWide} onChange={event=>setDraft(previous=>({...previous,projectWide:event.target.checked}))}/>Project-wide</label>
<div className="context-relationship-grid"><div className="context-picker"><strong>Streams</strong><RelationshipPicker compact label="Risk streams" items={state.streams} selected={draft.relatedStreamIds} onChange={ids=>setDraft(previous=>({...previous,relatedStreamIds:ids}))}/></div><div className="context-picker"><strong>Tasks</strong><RelationshipPicker compact label="Risk tasks" items={state.tasks} selected={draft.relatedTaskIds} onChange={ids=>setDraft(previous=>({...previous,relatedTaskIds:ids}))}/></div><div className="context-picker"><strong>Milestones</strong><RelationshipPicker compact label="Risk milestones" items={state.milestones} selected={draft.relatedMilestoneIds} onChange={ids=>setDraft(previous=>({...previous,relatedMilestoneIds:ids}))}/></div></div>
    <label>Description<HumanTextArea value={draft.description} onChange={event=>setDraft(previous=>({...previous,description:event.target.value}))}/></label>
    <small id={`risk-context-error-${risk.id}`} className="form-field-error" role={error?"alert":undefined}>{error||"\u00a0"}</small>
    <div className="actions"><button type="submit">Save context</button><button type="button" className="secondary" onClick={onClose}>Cancel</button></div>
  </form>;
}
