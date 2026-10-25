"use client";
import { PageToolbar } from "../shared/page-toolbar";
import { ModuleSearch } from "../shared/module-search";
import { matchesOption } from "../shared/searchable-option-list";
import { FilterChoices } from "../shared/record-filters";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { ProjectCommand, ProjectState, ProjectStore } from "../../application";
import type { ModuleName } from "../shell/shell";
import { EmptyState } from "../shell/shell";
import { deriveProjectWarnings, type ProjectWarning } from "./warnings";

export function canApplyWarningCorrection(state: ProjectState, warning: ProjectWarning): boolean {
  if (warning.action?.kind !== "remove-scope") return Boolean(warning.action);
  const milestone = state.milestones.find((item) => item.id === warning.entityId);
  return Boolean(milestone?.scope.kind === "streams" && milestone.scope.streamIds.length > 1);
}

export const warningCorrection = (warning: ProjectWarning): ProjectCommand => ({
  type: "warning-correction",
  apply(state) {
    if (!warning.action) return state;
    if (warning.action.kind === "remove-dependency") return { ...state, dependencies: state.dependencies.filter((dependency) => !(dependency.successor.id === warning.entityId && dependency.predecessor.id === warning.action?.referenceId)) };
    const milestone = state.milestones.find((item) => item.id === warning.entityId);
    if (!milestone || milestone.scope.kind !== "streams" || milestone.scope.streamIds.length <= 1) return state;
    return { ...state, milestones: state.milestones.map((item) => item.id === milestone.id && item.scope.kind === "streams" ? { ...item, scope: { kind: "streams", streamIds: item.scope.streamIds.filter((id) => id !== warning.action?.referenceId) } } : item) };
  },
});

export function WarningsPanel({ store, navigate }: { store: ProjectStore; navigate: (module: ModuleName, entityId?: string) => void }) {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const [types, setTypes] = useState<string[]>([]);
  const [query,setQuery]=useState("");
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const all = useMemo(() => deriveProjectWarnings(state), [state]);
  const warnings = all.filter((warning) => (!types.length || types.includes(warning.type)) && (!entityTypes.length || entityTypes.includes(warning.entityType)) && (!query.trim() || matchesOption({label:[warning.type,warning.entityType,warning.humanId,warning.entityName,warning.description].join(" ")},query)));
  const correct = (warning: ProjectWarning) => {
    if (!canApplyWarningCorrection(state, warning)) {
      window.alert("Select a valid replacement Scope in Milestones before removing the final deleted Stream reference.");
      navigate("Milestones", warning.entityId);
      return;
    }
    if (window.confirm(`${warning.action?.label}?`)) store.execute(warningCorrection(warning));
  };
  return <section className="panel"><PageToolbar><h1 className="module-page-title">WARNINGS ({all.length})</h1><ModuleSearch title="warnings" value={query} onChange={setQuery} placeholder="Search types, IDs, names and descriptions" activeFilters={types.length>0||entityTypes.length>0} onClearFilters={()=>{setTypes([]);setEntityTypes([])}}><FilterChoices label="Warning type" options={[...new Set(all.map(w=>w.type))].map(id=>({id,label:id}))} selected={types} onChange={setTypes}/><FilterChoices label="Entity type" options={[...new Set(all.map(w=>w.entityType))].map(id=>({id,label:id}))} selected={entityTypes} onChange={setEntityTypes}/></ModuleSearch></PageToolbar>{warnings.length === 0 ? <EmptyState title={all.length ? "No matching warnings" : "No project warnings"} description={all.length ? "Change the filters to see other warnings." : "No active inconsistencies were found."} /> : <ul className="warning-list">{warnings.map((warning) => <li key={warning.id}><div><strong>{warning.type}</strong><span>{warning.entityType} · {warning.humanId} · {warning.entityName}</span><p>{warning.description}</p></div><div className="actions"><button onClick={() => navigate(warning.destination, warning.entityId)}>Open</button>{warning.action && <button className="danger" onClick={() => correct(warning)}>{warning.action.label}</button>}</div></li>)}</ul>}</section>;
}
