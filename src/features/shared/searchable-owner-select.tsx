"use client";
import { PredictiveSelect } from "./predictive-select";
export interface OwnerOption {id:string;name:string;humanId?:string;deleted?:boolean}
export function SearchableOwnerSelect({label,value,disabled,people,onChange}:{
  label:string;value:string;disabled?:boolean;people:readonly OwnerOption[];onChange:(ownerId:string)=>void;
}) {
  return <PredictiveSelect label={label} value={value} disabled={disabled} options={[{id:"",name:"Unassigned"},...people.map(person=>({...person,disabled:person.deleted,name:person.name+(person.deleted?" (Deleted)":"")}))]} onChange={onChange}/>;
}
