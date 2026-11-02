"use client";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ProjectStore } from "../../application/store";
import { createCriticalPathCoordinator, type CalculationSnapshot } from "../../application/critical-path-coordinator";
import type { CriticalPathResult } from "../../domain/critical-path/types";

const INITIAL: CalculationSnapshot = { status: "Calculating", stale: true, revision: 0, result: null, scopes: new Map() };
interface AnalysisContext {
  snapshot: CalculationSnapshot;
  refresh: () => void;
  requestScope: (scope: string) => Promise<void>;
  ganttVisible: boolean;
  tubeVisible: boolean;
  setGanttVisible: (value: boolean) => void;
  setTubeVisible: (value: boolean) => void;
}
const Context = createContext<AnalysisContext>({ snapshot: INITIAL, refresh: () => {}, requestScope: async () => {}, ganttVisible: false, tubeVisible: false, setGanttVisible: () => {}, setTubeVisible: () => {} });

/** One externally subscribed session per open project; no calculated state enters ProjectStore. */
function createSession(store: ProjectStore) {
  let coordinator: ReturnType<typeof createCriticalPathCoordinator> | null = null;
  let snapshot = INITIAL;
  const listeners = new Set<() => void>();
  const publish = () => { snapshot = coordinator?.getSnapshot() ?? INITIAL; listeners.forEach(listener => listener()); };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh: () => coordinator?.refresh(),
    requestScope: (scope: string) => coordinator?.requestScope(scope) ?? Promise.resolve(),
    start() {
    let serial = 0, worker: Worker | null = null, activeRevision = -1;
    const pending = new Map<number, { resolve: (result: CriticalPathResult) => void; reject: () => void }>();
    const stop = () => { worker?.terminate(); worker = null; pending.forEach(p => p.reject()); pending.clear(); };
    const next = createCriticalPathCoordinator(store, (source, scope, revision) => new Promise((resolve, reject) => {
      if (revision !== activeRevision) { stop(); activeRevision = revision; }
      if (!worker) {
        worker = new Worker(new URL("./critical-path.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (event: MessageEvent<{ id: number; result?: CriticalPathResult; error?: boolean }>) => { const request = pending.get(event.data.id); pending.delete(event.data.id); if (event.data.result) request?.resolve(event.data.result); else request?.reject(); };
        worker.onerror = () => stop();
      }
      const id = ++serial; pending.set(id, { resolve, reject }); worker.postMessage({ source, scope, id });
    }));
    coordinator = next;
    const unsubscribe = next.subscribe(publish);
    publish();
    return () => { unsubscribe(); next.dispose(); coordinator = null; snapshot = INITIAL; stop(); };
    },
  };
}
export function CriticalPathProvider({ store, children }: { store: ProjectStore; children: ReactNode }) {
  const session = useMemo(() => createSession(store), [store]);
  const [visibility, setVisibility] = useState({ store, gantt: false, tube: false });
  // React's supported render-time reset keeps independent controls off on project replacement.
  if (visibility.store !== store) setVisibility({ store, gantt: false, tube: false });
  const ganttVisible = visibility.store === store && visibility.gantt;
  const tubeVisible = visibility.store === store && visibility.tube;
  useEffect(() => session.start(), [session]);
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, () => INITIAL);
  const value = useMemo(() => ({ snapshot, refresh: session.refresh, requestScope: session.requestScope, ganttVisible, tubeVisible, setGanttVisible: (gantt: boolean) => setVisibility(current => ({ ...current, gantt })), setTubeVisible: (tube: boolean) => setVisibility(current => ({ ...current, tube })) }), [snapshot, session, ganttVisible, tubeVisible]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useCriticalPath = () => useContext(Context);
