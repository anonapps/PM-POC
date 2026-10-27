"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { ProjectBaseline } from "../../domain/baselines";
import type { ProjectStore } from "../../application";
import { useProjectState } from "../shell/use-project-state";
import { capitaliseFirstLetter } from "../shared/text-normalisation";
import { PredictiveSelect } from "../shared/predictive-select";
const Selection=createContext<{baseline:ProjectBaseline|null;select:(id:string)=>void}>({baseline:null,select:()=>{}});
export function BaselineProvider({store,children}:{store:ProjectStore;children:ReactNode}) {
  const state=useProjectState(store),[id,setId]=useState<string|null>(null);
  const baseline=(state.baselines??[]).find(b=>b.id===id)??state.baselines?.[0]??null;
  return <Selection.Provider value={{baseline,select:setId}}>{children}</Selection.Provider>;
}
export const useBaselineSelection=()=>useContext(Selection);
export function BaselineSelector({store,compact=false}:{store:ProjectStore;compact?:boolean}) {
  const state=useProjectState(store),{baseline,select}=useBaselineSelection();
  return <div className={`baseline-selector${compact?" baseline-selector--compact":""}`}>{!compact&&<span>Comparison baseline</span>}<PredictiveSelect label="Comparison baseline" value={baseline?.id??""} options={state.baselines?.length?state.baselines.map(b=>({id:b.id,name:capitaliseFirstLetter(b.name)})):[{id:"",name:"No baselines"}]} disabled={!state.baselines?.length} onChange={select}/></div>;
}
