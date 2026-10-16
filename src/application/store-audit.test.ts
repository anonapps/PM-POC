import { describe, expect, it } from "vitest";
import { createProjectStore } from "./store";
import { setAuditEnabled } from "./audit";
import type { ProjectState } from "./state";

const initial = {
  project: { id: "p1", name: "Before", metadata: { schemaVersion: 2, minimumAppVersion: "1.0.0" } },
  streams: [], tasks: [], milestones: [], people: [], risks: [], decisions: [], relationships: [], dependencies: [], identifierSequences: {},
} as unknown as ProjectState;

const context = { now: () => "2026-10-16T10:00:00Z" };
const rename = (name: string) => ({
  type: "edit-project",
  apply: (state: ProjectState): ProjectState => ({ ...state, project: { ...state.project, name } }),
});

describe("store audit history", () => {
  it("records edits and undo/redo without removing previous history", () => {
    const store = createProjectStore({ ...initial, auditHistory: { enabled: true, events: [] } }, context);
    expect(store.execute(rename("After"))).toBe(true);
    expect(store.undo()).toBe(true);
    expect(store.getState().project.name).toBe("Before");
    expect(store.redo()).toBe(true);
    expect(store.getState().project.name).toBe("After");
    expect(store.getState().auditHistory?.events.map(event => event.command)).toEqual(["edit-project", "undo", "redo"]);
  });

  it("does not record disabled edits and retains existing events", () => {
    const store = createProjectStore({ ...initial, auditHistory: { enabled: true, events: [] } }, context);
    store.execute(rename("First"));
    store.execute(setAuditEnabled(false));
    store.execute(rename("Second"));
    expect(store.getState().auditHistory?.events).toHaveLength(1);
    expect(store.getState().auditHistory?.events[0].after).toBe("First");
  });

  it("does not add events for no-op commands", () => {
    const store = createProjectStore({ ...initial, auditHistory: { enabled: true, events: [] } }, context);
    expect(store.execute(rename("Before"))).toBe(false);
    expect(store.getState().auditHistory?.events).toHaveLength(0);
  });
});
