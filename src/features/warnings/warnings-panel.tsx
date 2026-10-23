"use client";
import { ModuleSearch } from "../shared/module-search";
import { ModuleFilter } from "../shared/module-filter";
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
  const [type, setType] = useState("All");
  const [query,setQuery]=useState("");
  const [entityType, setEntityType] = useState("All");
  const all = useMemo(() => deriveProjectWarnings(state), [state]);
  const warnings = all.filter((warning) => (type === "All" || warning.type === type) && (entityType === "All" || warning.entityType === entityType) && (!query.trim() || [warning.type,warning.entityType,warning.humanId,warning.entityName,warning.description].some(value=>value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))));
  const correct = (warning: ProjectWarning) => {
    if (!canApplyWarningCorrection(state, warning)) {
      window.alert("Select a valid replacement Scope in Milestones before removing the final deleted Stream reference.");
      navigate("Milestones", warning.entityId);
      return;
    }
    if (window.confirm(`${warning.action?.label}?`)) store.execute(warningCorrection(warning));
  };
  return <section className="panel"><div className="title-row"><h1 className="module-page-title">WARNINGS ({all.length})</h1></div><p className="muted">Warnings are derived from current project state and disappear when corrected.</p><ModuleSearch title="warnings" value={query} onChange={setQuery} placeholder="Search types, IDs, names and descriptions"/><ModuleFilter title="warnings" active={type!=="All"||entityType!=="All"} onClear={()=>{setType("All");setEntityType("All")}}><label>Warning type<select value={type} onChange={(event) => setType(event.target.value)}><option>All</option>{[...new Set(all.map((warning) => warning.type))].map((value) => <option key={value}>{value}</option>)}</select></label><label>Entity type<select value={entityType} onChange={(event) => setEntityType(event.target.value)}><option>All</option>{[...new Set(all.map((warning) => warning.entityType))].map((value) => <option key={value}>{value}</option>)}</select></label></ModuleFilter>{warnings.length === 0 ? <EmptyState title={all.length ? "No matching warnings" : "No project warnings"} description={all.length ? "Change the filters to see other warnings." : "No active inconsistencies were found."} /> : <ul className="warning-list">{warnings.map((warning) => <li key={warning.id}><div><strong>{warning.type}</strong><span>{warning.entityType} · {warning.humanId} · {warning.entityName}</span><p>{warning.description}</p></div><div className="actions"><button onClick={() => navigate(warning.destination, warning.entityId)}>Open</button>{warning.action && <button className="danger" onClick={() => correct(warning)}>{warning.action.label}</button>}</div></li>)}</ul>}</section>;
}
