import type { CommandContext, ProjectCommand } from "./commands";
import { recalculate } from "./commands";
import { recordAuditChange } from "./audit";
import { hydrateProjectState, projectStateEquals, type HydratableProjectState, type ProjectState } from "./state";

export interface ProjectStore {
  getState(): ProjectState;
  execute(command: ProjectCommand): boolean;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  isDirty(): boolean;
  acknowledgeSave(): void;
  subscribe(listener: () => void): () => void;
}

export function createProjectStore(input: HydratableProjectState, context: CommandContext): ProjectStore {
  let current = recalculate(hydrateProjectState(input));
  let persisted = current;
  let undoStack: ProjectState[] = [];
  let redoStack: ProjectState[] = [];
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    getState: () => current,
    execute(command) {
      const applied = recalculate(command.apply(current, context));
      if (projectStateEquals(applied, current)) return false;
      const next = applied.auditHistory?.enabled === true && command.type !== "set-audit-enabled" && command.type !== "replace-state"
        ? recordAuditChange(current, applied, command.type, context.now()) : applied;
      undoStack = [...undoStack, current]; current = next; redoStack = []; notify(); return true;
    },
    undo() {
      const previous = undoStack.at(-1); if (!previous) return false;
      undoStack = undoStack.slice(0, -1); redoStack = [current, ...redoStack]; current = current.auditHistory?.enabled === true ? recordAuditChange(current, { ...recalculate(previous), auditHistory: current.auditHistory }, "undo", context.now()) : { ...recalculate(previous), auditHistory: current.auditHistory }; notify(); return true;
    },
    redo() {
      const next = redoStack[0]; if (!next) return false;
      redoStack = redoStack.slice(1); undoStack = [...undoStack, current]; current = current.auditHistory?.enabled === true ? recordAuditChange(current, { ...recalculate(next), auditHistory: current.auditHistory }, "redo", context.now()) : { ...recalculate(next), auditHistory: current.auditHistory }; notify(); return true;
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    isDirty: () => !projectStateEquals(current, persisted),
    acknowledgeSave() { persisted = current; notify(); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
