import { describe, expect, it } from "vitest";
import { createProjectStore } from "./store";
import { setAuditEnabled } from "./audit";
import type { ProjectState } from "./state";

const initial = {
  project: { id: "p1", name: "Before", metadata: { schemaVersion: 2, minimumAppVersion: "1.0.0" } },
  streams: [], tasks: [], milestones: [], people: [], risks: [], decisions: [], relationships: [], dependencies: [], identifierSequences: {},
} as unknown as ProjectState;

const context = { createId: () => "test-id", now: () => "2026-10-16T10:00:00Z" };
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

  it("avoids requesting audit timestamps when disabled", () => {
    let clockCalls = 0;
    const store = createProjectStore(initial, { ...context, now: () => { clockCalls += 1; return "2026-10-16T10:00:00Z"; } });
    expect(store.execute(rename("After"))).toBe(true);
    expect(store.undo()).toBe(true);
    expect(store.redo()).toBe(true);
    expect(clockCalls).toBe(0);
  });

  it("keeps the audit toggle disabled through undo and redo", () => {
    const store = createProjectStore({ ...initial, auditHistory: { enabled: true, events: [] } }, context);
    store.execute(rename("First"));
    store.execute(setAuditEnabled(false));
    store.execute(rename("Second"));
    expect(store.undo()).toBe(true);
    expect(store.getState().auditHistory?.enabled).toBe(false);
    expect(store.getState().project.name).toBe("First");
    expect(store.redo()).toBe(true);
    expect(store.getState().auditHistory?.enabled).toBe(false);
    expect(store.getState().project.name).toBe("Second");
    expect(store.getState().auditHistory?.events).toHaveLength(1);
  });

  it("starts recording again after audit history is re-enabled", () => {
    const store = createProjectStore({ ...initial, auditHistory: { enabled: true, events: [] } }, context);
    store.execute(rename("First"));
    store.execute(setAuditEnabled(false));
    store.execute(rename("Second"));
    store.execute(setAuditEnabled(true));
    store.execute(rename("Third"));
    expect(store.getState().auditHistory?.events.map(event => event.after)).toEqual(["First", "Third"]);
  });

  it("does not add events for no-op commands", () => {
    const store = createProjectStore({ ...initial, auditHistory: { enabled: true, events: [] } }, context);
    expect(store.execute(rename("Before"))).toBe(false);
    expect(store.getState().auditHistory?.events).toHaveLength(0);
  });
});


describe("audit retention order", () => {
  it("keeps the most recent five thousand changes in their original order", () => {
    const store = createProjectStore({ ...initial, auditHistory: { enabled: true, events: [] } }, context);
    for (let index = 0; index < 5002; index += 1) {
      store.execute(rename(`Revision ${index}`));
    }
    const events = store.getState().auditHistory?.events ?? [];
    expect(events).toHaveLength(5000);
    expect(events[0].after).toBe("Revision 2");
    expect(events.at(-1)?.after).toBe("Revision 5001");
    expect(events.every(event => event.command === "edit-project")).toBe(true);
  }, 30000);
});


describe("audit retention for a single large command", () => {
  it("keeps the last five thousand events when one command changes more than five thousand fields", () => {
    const store = createProjectStore({ ...initial, auditHistory: { enabled: true, events: [] } }, context);
    const fields = Array.from({ length: 5002 }, (_, index) => ({
      id: `person-${index}`,
      projectId: "p1",
      humanId: `PERSON-${index}`,
      name: `Person ${index}`,
      deletion: { isDeleted: false },
    }));
    const command = {
      type: "bulk-create-people",
      apply: (state: ProjectState): ProjectState => ({ ...state, people: fields as unknown as ProjectState["people"] }),
    };
    expect(store.execute(command)).toBe(true);
    const events = store.getState().auditHistory?.events ?? [];
    expect(events).toHaveLength(5000);
    expect(events[0].entityId).toBe("person-2");
    expect(events.at(-1)?.entityId).toBe("person-5001");
  }, 30000);
});
