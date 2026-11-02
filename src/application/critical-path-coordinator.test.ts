import { afterEach, expect, it, vi } from "vitest";
import { createCriticalPathCoordinator } from "./critical-path-coordinator";
import { calculateCriticalPath } from "../domain/critical-path/calculate";
import { createProjectStore } from "./store";
import { makeProjectState, taskFixture, streamFixture } from "../domain/test-fixtures";
import { editTask } from "../features/tasks/commands";
import type { CriticalPathResult } from "../domain/critical-path/types";
afterEach(() => vi.useRealTimers());
const create = () => createProjectStore(makeProjectState({ streams: [streamFixture()], tasks: [taskFixture({ startDate: "2026-01-01", endDate: "2026-01-03" })], auditHistory: { enabled: true, events: [] } }), { now: () => "2026-01-01T00:00:00Z", createId: () => "event" });
it("batches commits, skips non-mathematical notifications, and follows Undo/Redo without calculation history", async () => {
  vi.useFakeTimers(); const store = create(), run = vi.fn(async source => calculateCriticalPath(source));
  const coordinator = createCriticalPathCoordinator(store, run);
  await vi.advanceTimersByTimeAsync(100); expect(run).toHaveBeenCalledTimes(1); expect(store.isDirty()).toBe(false); expect(store.canUndo()).toBe(false);
  store.acknowledgeSave(); store.execute(editTask("task-1", { name: "Renamed" }));
  await vi.advanceTimersByTimeAsync(100); expect(run).toHaveBeenCalledTimes(1);
  store.execute(editTask("task-1", { endDate: "2026-01-04" })); store.execute(editTask("task-1", { endDate: "2026-01-05" }));
  const auditCount = store.getState().auditHistory!.events.length;
  expect(coordinator.getSnapshot().stale).toBe(true); await vi.advanceTimersByTimeAsync(100);
  expect(run).toHaveBeenCalledTimes(2); expect(coordinator.getSnapshot().result?.completion).toBe("2026-01-05"); expect(store.getState().auditHistory!.events).toHaveLength(auditCount);
  store.undo(); await vi.advanceTimersByTimeAsync(100); expect(coordinator.getSnapshot().result?.completion).toBe("2026-01-04");
  store.redo(); await vi.advanceTimersByTimeAsync(100); expect(coordinator.getSnapshot().result?.completion).toBe("2026-01-05"); coordinator.dispose();
});
it("discards superseded results and recovers from failures through Refresh", async () => {
  vi.useFakeTimers(); const store = create(), requests: { resolve: (r: CriticalPathResult) => void; reject: () => void }[] = [];
  const coordinator = createCriticalPathCoordinator(store, () => new Promise((resolve, reject) => requests.push({ resolve, reject })));
  await vi.advanceTimersByTimeAsync(100); const old = calculateCriticalPath(store.getState());
  store.execute(editTask("task-1", { endDate: "2026-01-06" })); await vi.advanceTimersByTimeAsync(100);
  requests[1].resolve(calculateCriticalPath(store.getState())); await vi.advanceTimersByTimeAsync(0); requests[0].resolve(old); await vi.advanceTimersByTimeAsync(0);
  expect(coordinator.getSnapshot().result?.completion).toBe("2026-01-06");
  coordinator.refresh(); await vi.advanceTimersByTimeAsync(100); requests[2].reject(); await vi.advanceTimersByTimeAsync(0); expect(coordinator.getSnapshot().status).toBe("Unavailable");
  coordinator.refresh(); await vi.advanceTimersByTimeAsync(100); requests[3].resolve(calculateCriticalPath(store.getState())); await vi.advanceTimersByTimeAsync(0); expect(coordinator.getSnapshot().status).toBe("Up to date"); coordinator.dispose();
});
it("caches a requested scope within a revision and disposes outstanding work", async () => {
  vi.useFakeTimers(); const store = create(), run = vi.fn(async (source, scope) => calculateCriticalPath(source, scope)); const coordinator = createCriticalPathCoordinator(store, run);
  await vi.advanceTimersByTimeAsync(100); await coordinator.requestScope("stream-1"); await coordinator.requestScope("stream-1"); expect(run).toHaveBeenCalledTimes(2);
  coordinator.dispose(); store.execute(editTask("task-1", { endDate: "2026-01-07" })); await vi.advanceTimersByTimeAsync(100); expect(run).toHaveBeenCalledTimes(2);
});
