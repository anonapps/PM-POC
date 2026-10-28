"use client";
import { PredictiveDisclosure } from "./predictive-disclosure";
import { SearchableOptionList } from "./searchable-option-list";
import { ChoiceRow } from "./choice-row";
export interface RelatedOption {id:string;humanId:string;name?:string;title?:string;deletion:{isDeleted:boolean}}
export function RelationshipPicker({label,items,selected,onChange,id,error,compact=false}:{label:string;items:readonly RelatedOption[];selected:readonly string[];onChange:(ids:string[])=>void;id?:string;error?:string;compact?:boolean}) {
  return <PredictiveDisclosure className="relationship-picker"><summary aria-label={compact?label:undefined} title={`${label} · ${selected.length} selected`} id={id} aria-invalid={error?true:undefined} aria-describedby={error&&id?`${id}-error`:undefined}>{compact?"":`${label} · `}{selected.length} selected</summary><div className="relationship-options"><SearchableOptionList items={items.filter(item=>!item.deletion.isDeleted||selected.includes(item.id))} label={`Search ${label}`} renderOption={item=><ChoiceRow key={item.id} input={{type:"checkbox",checked:selected.includes(item.id),onChange:event=>onChange(event.target.checked?[...new Set([...selected,item.id])]:selected.filter(id=>id!==item.id))}}>{item.name??item.title} · {item.humanId}{item.deletion.isDeleted?" (Deleted)":""}</ChoiceRow>}/></div></PredictiveDisclosure>;
}
