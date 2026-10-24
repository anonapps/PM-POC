"use client";
import { useState } from "react";
import type { Risk } from "../../domain";
import type { ProjectState, ProjectStore } from "../../application";
import { RelationshipPicker } from "../shared/relationship-picker";
import { SearchableOwnerSelect } from "../shared/searchable-owner-select";
import { editRisk, validateRisk } from "./commands";
export function RiskContextEditor({risk,state,store,onClose}:{risk:Risk;state:ProjectState;store:ProjectStore;onClose:()=>void}) {
  const [error,setError]=useState("");
  const [draft,setDraft]=useState({description:risk.description??"",ownerId:risk.ownerId,projectWide:risk.projectWide,relatedStreamIds:[...risk.relatedStreamIds],relatedTaskIds:[...risk.relatedTaskIds],relatedMilestoneIds:[...risk.relatedMilestoneIds]});
  return <form className="risk-context-editor" aria-label={`Context for ${risk.humanId}`} onSubmit={event=>{event.preventDefault();const errors=validateRisk(store.getState(),{...risk,...draft});if(errors.length){setError(errors.join(" "));return;}store.execute(editRisk(risk.id,draft));onClose();}} onKeyDown={event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();event.currentTarget.requestSubmit();}}}>
    <SearchableOwnerSelect label={`Owner for ${risk.humanId}`} value={draft.ownerId??""} people={state.people.filter(person=>!person.deletion.isDeleted||person.id===draft.ownerId).map(person=>({...person,deleted:person.deletion.isDeleted}))} onChange={id=>setDraft(previous=>({...previous,ownerId:id||null}))}/>
    <label><input type="checkbox" checked={draft.projectWide} onChange={event=>setDraft(previous=>({...previous,projectWide:event.target.checked}))}/>Project-wide</label>
    <RelationshipPicker label="Risk streams" items={state.streams} selected={draft.relatedStreamIds} onChange={ids=>setDraft(previous=>({...previous,relatedStreamIds:ids}))}/>
    <RelationshipPicker label="Risk tasks" items={state.tasks} selected={draft.relatedTaskIds} onChange={ids=>setDraft(previous=>({...previous,relatedTaskIds:ids}))}/>
    <RelationshipPicker label="Risk milestones" items={state.milestones} selected={draft.relatedMilestoneIds} onChange={ids=>setDraft(previous=>({...previous,relatedMilestoneIds:ids}))}/>
    <label>Description<textarea value={draft.description} onChange={event=>setDraft(previous=>({...previous,description:event.target.value}))}/></label>
    {error&&<small role="alert">{error}</small>}
    <button type="submit">Save context</button><button type="button" className="secondary" onClick={onClose}>Cancel</button>
  </form>;
}
