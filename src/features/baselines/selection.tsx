"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { ProjectBaseline } from "../../domain/baselines";
import type { ProjectStore } from "../../application";
import { useProjectState } from "../shell/use-project-state";
import { PredictiveSelect } from "../shared/predictive-select";
const Selection=createContext<{baseline:ProjectBaseline|null;select:(id:string)=>void}>({baseline:null,select:()=>{}});
export function BaselineProvider({store,children}:{store:ProjectStore;children:ReactNode}) {
  const state=useProjectState(store),[id,setId]=useState<string|null>(null);
  const baseline=(state.baselines??[]).find(b=>b.id===id)??state.baselines?.[0]??null;
  return <Selection.Provider value={{baseline,select:setId}}>{children}</Selection.Provider>;
}
export const useBaselineSelection=()=>useContext(Selection);
export function BaselineSelector({store}:{store:ProjectStore}) {
  const state=useProjectState(store),{baseline,select}=useBaselineSelection();
  return <div className="baseline-selector"><span>Comparison baseline</span><PredictiveSelect label="Comparison baseline" value={baseline?.id??""} options={state.baselines?.length?state.baselines.map(b=>({id:b.id,name:b.name})):[{id:"",name:"No baselines"}]} disabled={!state.baselines?.length} onChange={select}/></div>;
}
