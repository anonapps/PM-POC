"use client";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ProjectStore } from "@/application";

export const MODULES = ["Overview", "Streams", "People", "Tasks", "Milestones", "Gantt", "Tube Map", "Risk Log", "Decision Log", "Warnings", "Search", "File Information"] as const;
export type ModuleName = (typeof MODULES)[number];
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

export function AppShell({ store, onClose, onSave, children }: { store?: ProjectStore; onClose: () => void; onSave: () => Promise<void>; children?: (module: ModuleName, navigate: (module: ModuleName) => void) => ReactNode }) {
  const [module, setModule] = useState<ModuleName>("Overview"); const [collapsed, setCollapsed] = useState(false); const [operationState, setOperationState] = useState<SaveVisualState>();
  const state = useSyncExternalStore(store?.subscribe ?? (() => () => {}), store?.getState ?? (() => undefined), store?.getState ?? (() => undefined));
  const saveState: SaveVisualState = operationState ?? (store?.isDirty() ? "dirty" : "saved");
  const save = async () => { if (!store?.isDirty()) return; const timer = window.setTimeout(() => setOperationState("saving"), 500); try { await onSave(); setOperationState(undefined); } catch { setOperationState("failed"); } finally { clearTimeout(timer); } };
  useEffect(() => { const handler = (event: KeyboardEvent) => { const action = keyboardAction(event); if (!action) return; event.preventDefault(); if (action === "save") void save(); if (action === "undo") store?.undo(); if (action === "redo") store?.redo(); if (action === "search") setModule("Search"); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); });
  if (!store || !state) return <main className="launcher"><section><h1>No active project</h1><button onClick={onClose}>Return to Launcher</button></section></main>;
  return <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
    <aside><div className="brand">{collapsed ? "PM" : "PROJECT MANAGER"}</div><button className="collapse" aria-label="Toggle compact sidebar" onClick={() => setCollapsed(!collapsed)}>☰</button><nav aria-label="Project modules">{MODULES.map((name) => <button key={name} title={name} aria-current={module === name ? "page" : undefined} onClick={() => setModule(name)}><span>{name.slice(0, 1)}</span>{!collapsed && name}</button>)}</nav></aside>
    <div className="app-main"><header><div><p>Current project</p><strong>{state.project.name}</strong></div><div className="header-actions"><span className={`save-state ${saveState}`}>{saveStateLabel(saveState)}</span><button className="secondary" disabled={!store.isDirty()} onClick={() => void save()}>Save Now</button><button className="icon" aria-label="Undo" disabled={!store.canUndo()} onClick={() => store.undo()}>↶</button><button className="icon" aria-label="Redo" disabled={!store.canRedo()} onClick={() => store.redo()}>↷</button><button className="search" onClick={() => setModule("Search")}>Search <kbd>⌘K</kbd></button><button className="secondary" onClick={onClose}>Close</button></div></header>
      <main className="workspace">{children ? children(module, setModule) : <Placeholder module={module} />}</main>
    </div>
  </div>;
}
function Placeholder({ module }: { module: ModuleName }) { return <section className="panel"><p className="eyebrow">Module</p><h1>{module}</h1><div className="empty"><strong>{module} is ready</strong><p>This module will become operational in its scheduled implementation block.</p></div></section>; }

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header><h2 id="dialog-title">{title}</h2><button className="icon" aria-label="Close" onClick={onClose}>×</button></header>{children}</section></div>; }
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="empty"><strong>{title}</strong><p>{description}</p>{action}</div>; }
export function Status({ children }: { children: ReactNode }) { return <span className="status">{children}</span>; }
