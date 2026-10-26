"use client";
import { Button, Chip } from "@heroui/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ProjectStore } from "@/application";
import type { RuntimeSaveStatus } from "@/runtime/project-runtime";
import { deriveProjectWarnings } from "../warnings/warnings";

export const MODULES = ["Overview", "Search", "Streams", "People", "Tasks", "Gantt", "Milestones", "Tube Map", "Risk Log", "Decision Log", "Baselines", "Dependencies", "Warnings", "File Information"] as const;
export type ModuleName = (typeof MODULES)[number];
export interface NavigationTarget { readonly module: ModuleName; readonly entityId?: string; readonly requestId: number }
let nextNavigationRequestId = 0;
export const createNavigationTarget = (module: ModuleName, entityId: string | undefined, requestId = ++nextNavigationRequestId): NavigationTarget => ({ module, entityId, requestId });
export type SaveVisualState = "saved" | "dirty" | "saving" | "failed" | "lost";
export const saveStateLabel = (state: SaveVisualState, savedAt?: string) => ({ saved: `Saved${savedAt ? ` · ${savedAt}` : ""}`, dirty: "Unsaved", saving: "Saving…", failed: "Save failed", lost: "File access lost" })[state];
export function keyboardAction(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "shiftKey">): "save" | "undo" | "redo" | "search" | undefined {
  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();
  if (key === "s") return "save";
  if (key === "k") return "search";
  if (key === "y" || (key === "z" && event.shiftKey)) return "redo";
  if (key === "z") return "undo";
}

export function AppShell({ store, onClose, onSave, onSaveAs, onReload, onKeepCurrent, runtimeStatus, lastSavedAt, failedSaveCount=0, message, pendingSwitch, onContinueSwitch, onCancelSwitch, children }: { store?: ProjectStore; onClose: () => void | Promise<void>; onSave: () => Promise<void>; onSaveAs:()=>Promise<void>; onReload:()=>Promise<void>; onKeepCurrent:()=>Promise<void>; runtimeStatus?:RuntimeSaveStatus; lastSavedAt?:string; failedSaveCount?:number; message?:string; pendingSwitch?:boolean; onOpenProject:()=>Promise<void>; onContinueSwitch:()=>Promise<void>; onCancelSwitch:()=>void; children?: (module: ModuleName, navigate: (module: ModuleName, entityId?: string) => void, target?: NavigationTarget) => ReactNode }) {
  const workspaceRef = useRef<HTMLElement>(null);

  const [module, setModule] = useState<ModuleName>("Overview"); const [target,setTarget]=useState<NavigationTarget>(); const [pendingNavigation,setPendingNavigation]=useState<{module:ModuleName;entityId?:string}|null>(null); const commitNavigation=(next:ModuleName,entityId?:string)=>{setModule(next);setTarget(createNavigationTarget(next,entityId));setPendingNavigation(null)}; const navigate=(next:ModuleName,entityId?:string)=>{if(next===module&&!entityId)return;const draft=document.querySelector<HTMLFormElement>("form[data-create-draft]");const hasDraft=draft?.dataset.dirty==="true"||draft&&draft.dataset.dirty===undefined&&Array.from(draft.elements).some(element=>(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement)&&element.type!=="checkbox"&&element.type!=="radio"&&element.type!=="submit"&&element.type!=="button"&&element.value.trim().length>0);if(hasDraft){setPendingNavigation({module:next,entityId});return}commitNavigation(next,entityId)}; const [collapsed, setCollapsed] = useState(false); const [operationState, setOperationState] = useState<SaveVisualState>();
  useEffect(() => {
    if (!target?.entityId) return;
    const clearHighlight = (event: PointerEvent) => {
      const workspace = workspaceRef.current;
      if (!workspace || !(event.target instanceof Node) || !workspace.contains(event.target)) return;
      setTarget(current => current?.requestId === target.requestId ? undefined : current);
    };
    document.addEventListener("pointerdown", clearHighlight);
    return () => document.removeEventListener("pointerdown", clearHighlight);
  }, [target?.requestId, target?.entityId]);
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 850px)");
    const compact = () => { if (narrow.matches) setCollapsed(true); };
    compact();
    narrow.addEventListener("change", compact);
    return () => narrow.removeEventListener("change", compact);
  }, []);
  const state = useSyncExternalStore(store?.subscribe ?? (() => () => {}), store?.getState ?? (() => undefined), store?.getState ?? (() => undefined));
  const mapped:SaveVisualState|undefined=runtimeStatus==="save-failed"?"failed":runtimeStatus==="file-lost"?"lost":runtimeStatus==="dirty"?"dirty":runtimeStatus==="saved"?"saved":undefined; const saveState: SaveVisualState = operationState ?? mapped ?? (store?.isDirty() ? "dirty" : "saved"); const savedTime=lastSavedAt?new Date(lastSavedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):undefined;
  const save = async () => { if (!store?.isDirty()) return; const timer = window.setTimeout(() => setOperationState("saving"), 500); try { await onSave(); setOperationState(undefined); } catch { setOperationState("failed"); } finally { clearTimeout(timer); } };
  useEffect(() => { const handler = (event: KeyboardEvent) => { const action = keyboardAction(event); if (!action) return; if ((action === "undo" || action === "redo") && (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable))) return; event.preventDefault(); if (action === "save") void save(); if (action === "undo") store?.undo(); if (action === "redo") store?.redo(); if (action === "search") navigate("Search"); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); });
  useLayoutEffect(() => {
    const workspace = workspaceRef.current;
    const toolbar = workspace?.querySelector<HTMLElement>(".panel > .title-row");
    if (!workspace || !toolbar) return;
    const measure = () => workspace.style.setProperty("--module-toolbar-height", `${toolbar.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar);
    measure();
    return () => { observer.disconnect(); workspace.style.removeProperty("--module-toolbar-height"); };
  }, [module, store]);
  if (!store || !state) return <main className="launcher"><section><h1>No active project</h1><Button onClick={onClose}>Return to Launcher</Button></section></main>;
  const warningCount=deriveProjectWarnings(state).length;
  return <div className={`app-shell ${collapsed ? "sidebar-hidden" : ""}`}>
    <aside id="project-sidebar"><div className="sidebar-heading"><Button className="brand" onClick={()=>navigate("Overview")}>ARGOS PM</Button></div><button type="button" className="sidebar-toggle" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} aria-controls="project-modules" onClick={() => setCollapsed(!collapsed)}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={collapsed ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"}/></svg></button><nav id="project-modules" aria-label="Project modules">{MODULES.map((name) => <Button variant="light" radius="md" className="hero-nav" key={name} title={name} aria-label={name} aria-current={module === name ? "page" : undefined} onClick={() => navigate(name)}><span className="module-letter" aria-hidden="true">{name === "Overview" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-7h6v7"/></svg> : name === "Search" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg> : name === "People" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg> : name === "Tasks" ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 12 3 3 6-7"/></svg> : name.slice(0,1)}</span><span className="module-label">{name==="Warnings"&&warningCount?`Warnings (${warningCount})`:name}</span></Button>)}</nav></aside>
    <div className="app-main"><header><div className="project-name-inline"><p>Project name</p><strong title={state.project.name}>{state.project.name}</strong></div><div className="header-actions"><Chip size="sm" variant="flat" role="status" aria-live="polite" className={`save-state ${saveState}`}>{saveStateLabel(saveState,savedTime)}</Chip><Button className="secondary" isDisabled={!store.isDirty()} onClick={() => void save()}>Save Now</Button><Button className="icon" aria-label="Undo" isDisabled={!store.canUndo()} onClick={() => store.undo()}>↶</Button><Button className="icon" aria-label="Redo" isDisabled={!store.canRedo()} onClick={() => store.redo()}>↷</Button></div></header>
      <main ref={workspaceRef} className={`workspace module-${module.toLowerCase().replaceAll(" ", "-")}`}>{pendingSwitch&&<div className="alert" role="alert"><strong>Save failed</strong><p>Continue and discard unsaved changes, or cancel the project switch.</p><div className="actions"><Button className="danger" onClick={()=>void onContinueSwitch()}>Continue and discard</Button><Button className="secondary" onClick={onCancelSwitch}>Cancel</Button></div></div>}{(runtimeStatus==="save-failed"||runtimeStatus==="file-lost")&&<div className="alert" role="alert"><strong>{runtimeStatus==="file-lost"?"File access lost":"Save failed"}</strong><p>{message} Your current work remains in memory.</p><div className="actions"><Button onClick={()=>void save()}>Retry</Button>{failedSaveCount>1&&<Button className="secondary" onClick={()=>void onSaveAs()}>Save As</Button>}</div></div>}{runtimeStatus==="externally-modified"&&<div className="alert" role="alert"><strong>Project file changed externally</strong><p>{message}</p><div className="actions"><Button onClick={()=>void onKeepCurrent()}>Keep Current</Button><Button className="secondary" onClick={()=>void onReload()}>Reload from File</Button></div></div>}{children ? children(module, navigate, target) : <Placeholder module={module} />}{pendingNavigation&&<Dialog title="Discard unsaved changes?" onClose={()=>setPendingNavigation(null)}><p>The current creation form has unsaved values. Discard them and navigate away, or stay to continue editing.</p><div className="form-actions"><Button type="button" className="secondary" onClick={()=>setPendingNavigation(null)}>Stay</Button><Button type="button" className="danger" onClick={()=>commitNavigation(pendingNavigation.module,pendingNavigation.entityId)}>Discard</Button></div></Dialog>}</main>
    </div>
  </div>;
}
function Placeholder({ module }: { module: ModuleName }) { return <section className="panel"><p className="eyebrow">Module</p><h1>{module}</h1><div className="empty"><strong>{module} is ready</strong><p>This module will become operational in its scheduled implementation block.</p></div></section>; }

export function Dialog({ title, children, onClose, variant, initialFocusId }: { title: string; children: ReactNode; onClose: () => void; variant?:"creation"; initialFocusId?:string }) { const titleId = useId(); const dialog=useRef<HTMLElement>(null); const onCloseRef=useRef(onClose); useEffect(()=>{onCloseRef.current=onClose;},[onClose]); useEffect(()=>{const prior=document.activeElement as HTMLElement|null;const node=dialog.current;(initialFocusId?node?.querySelector<HTMLElement>(`[id="${initialFocusId}"]`):node)?.focus();const key=(event:KeyboardEvent)=>{if(event.defaultPrevented||[...document.querySelectorAll('[role="dialog"]')].at(-1)!==node)return;if(event.key==="Escape"){event.preventDefault();onCloseRef.current()}if(event.key==="Tab"&&node){const controls=[...node.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary:not([aria-disabled="true"]),[tabindex="0"]')].filter(control=>control.checkVisibility());if(!controls.length)return;const first=controls[0],last=controls.at(-1)!;if(event.shiftKey&&(document.activeElement===first||document.activeElement===node||!node.contains(document.activeElement))){event.preventDefault();last.focus()}else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===node||!node.contains(document.activeElement))){event.preventDefault();first.focus()}}};document.addEventListener("keydown",key);return()=>{document.removeEventListener("keydown",key);prior?.focus()}},[initialFocusId]); return <div className={`dialog-backdrop ${variant==="creation"?"creation-backdrop":""}`} role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}><header><h2 id={titleId}>{title}</h2><button className="icon" aria-label={`Close ${title}`} onClick={onClose}>×</button></header>{children}</section></div>; }
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="empty"><strong>{title}</strong><p>{description}</p>{action}</div>; }
export function Status({ children }: { children: ReactNode }) { return <Chip size="sm" variant="flat" className="status">{children}</Chip>; }
