"use client";
import { useId, useRef, type ReactNode } from "react";
import { SearchableOptionList } from "./searchable-option-list";
import { PredictiveDisclosure } from "./predictive-disclosure";
import { ChoiceRow } from "./choice-row";
export interface SelectOption {id:string;name:string;humanId?:string;disabled?:boolean}
export function PredictiveSelect({label,value,options,onChange,disabled=false,renderValue}:{label:string;value:string;options:readonly SelectOption[];onChange:(value:string)=>void;disabled?:boolean;renderValue?:ReactNode}) {
  const group=useId();
  const ref=useRef<HTMLDetailsElement>(null);
  const current=options.find(option=>option.id===value);
  return <PredictiveDisclosure ref={ref} className="predictive-select multi-select" disabled={disabled}>
    <summary title={current?.name} aria-label={label} aria-disabled={disabled} data-value={value}>{renderValue??current?.name??"Previously selected value (unavailable)"}</summary>
    <div className="multi-select-options"><SearchableOptionList items={options} label={`Search ${label}`} renderOption={option=><ChoiceRow key={option.id} input={{type:"radio",name:group,value:option.id,checked:option.id===value,disabled:disabled||option.disabled,onChange:()=>{},onClick:()=>{if(option.id!==value)onChange(option.id);if(ref.current){ref.current.open=false;ref.current.querySelector("summary")?.focus();}}}}>{option.name}{option.humanId?` · ${option.humanId}`:""}</ChoiceRow>}/></div>
  </PredictiveDisclosure>;
}
