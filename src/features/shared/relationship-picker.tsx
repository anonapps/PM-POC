"use client";
import { PredictiveDisclosure } from "./predictive-disclosure";
import { SearchableOptionList } from "./searchable-option-list";
export interface RelatedOption {id:string;humanId:string;name?:string;title?:string;deletion:{isDeleted:boolean}}
export function RelationshipPicker({label,items,selected,onChange}:{label:string;items:readonly RelatedOption[];selected:readonly string[];onChange:(ids:string[])=>void}) {
  return <PredictiveDisclosure className="relationship-picker"><summary>{label} · {selected.length} selected</summary><div className="relationship-options"><SearchableOptionList items={items.filter(item=>!item.deletion.isDeleted||selected.includes(item.id))} label={`Search ${label}`} renderOption={item=><label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={event=>onChange(event.target.checked?[...new Set([...selected,item.id])]:selected.filter(id=>id!==item.id))}/>{item.name??item.title} · {item.humanId}{item.deletion.isDeleted?" (Deleted)":""}</label>}/></div></PredictiveDisclosure>;
}
