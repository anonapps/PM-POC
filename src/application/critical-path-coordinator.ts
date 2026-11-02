import type { ProjectStore } from "./store";
import type { CalculationSource, CalculationStatus, CriticalPathResult } from "../domain/critical-path/types";

export interface CalculationSnapshot { status: CalculationStatus; stale: boolean; revision: number; result: CriticalPathResult | null; scopes: ReadonlyMap<string, CriticalPathResult> }
export type CalculationRunner = (source: CalculationSource, scope: string | null, revision: number) => Promise<CriticalPathResult>;
/** Mathematical inputs only: names, baselines, audit, save metadata and presentation do not invalidate CPM. */
export function calculationSignature(state: CalculationSource): string {
  return JSON.stringify([state.project.id, state.project.startDate, state.tasks.map(t => [t.id, t.startDate, t.endDate, t.scope, t.deletion.isDeleted]), state.milestones.map(m => [m.id, m.plannedDate, m.scope, m.deletion.isDeleted]), state.dependencies]);
}
export function createCriticalPathCoordinator(store: ProjectStore, run: CalculationRunner, delay = 100) {
  let signature = "", revision = 0, disposed = false, timer: ReturnType<typeof setTimeout> | undefined;
  let snapshot: CalculationSnapshot = { status: "Calculating", stale: true, revision, result: null, scopes: new Map() };
  const listeners = new Set<() => void>(), pendingScopes = new Map<string, Promise<void>>();
  const publish = (next: CalculationSnapshot) => { if (disposed) return; snapshot = next; listeners.forEach(listener => listener()); };
  const calculate = async (scope: string | null = null) => {
    const requested = revision, state = store.getState();
    const source: CalculationSource = { project: state.project, tasks: state.tasks, milestones: state.milestones, dependencies: state.dependencies, streams: state.streams };
    try {
      const result = await run(source, scope, requested);
      if (disposed || requested !== revision) return;
      if (scope === null) publish({ ...snapshot, status: result.status, result, stale: false });
      else publish({ ...snapshot, scopes: new Map([...snapshot.scopes, [scope, result]]) });
    } catch {
      if (!disposed && requested === revision) publish({ ...snapshot, status: "Unavailable", stale: true });
    }
  };
  const refresh = () => {
    clearTimeout(timer); revision++; pendingScopes.clear();
    publish({ ...snapshot, revision, status: "Calculating", stale: true, scopes: new Map() });
    timer = setTimeout(() => { void calculate(); }, delay);
  };
  const changed = () => { const next = calculationSignature(store.getState()); if (next !== signature) { signature = next; refresh(); } };
  const unsubscribe = store.subscribe(changed); changed();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh,
    requestScope(scope: string) {
      if (snapshot.stale || snapshot.scopes.has(scope)) return Promise.resolve();
      const existing = pendingScopes.get(scope); if (existing) return existing;
      const requested = revision;
      const promise = calculate(scope).finally(() => { if (requested === revision) pendingScopes.delete(scope); });
      pendingScopes.set(scope, promise); return promise;
    },
    dispose() { disposed = true; clearTimeout(timer); unsubscribe(); listeners.clear(); pendingScopes.clear(); },
  };
}
