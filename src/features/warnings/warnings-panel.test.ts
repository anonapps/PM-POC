import { describe, expect, it } from "vitest";
import { makeProjectState, streamFixture } from "../../domain/test-fixtures";
import { canApplyWarningCorrection, warningCorrection } from "./warnings-panel";
import { deriveProjectWarnings } from "./warnings";

describe("warning corrective actions", () => {
  it("requires a replacement before removing the final deleted milestone Stream", () => {
    const deleted = streamFixture({ deletion: { isDeleted: true } });
    const state = makeProjectState({ streams: [deleted], milestones: [{ id: "m", projectId: "project-1", humanId: "MILESTONE-001", name: "Gate", plannedDate: "2026-03-01", status: "Planned", ownerId: null, scope: { kind: "streams", streamIds: [deleted.id] }, relatedTaskIds: [], deletion: { isDeleted: false } }] });
    const warning = deriveProjectWarnings(state).find((item) => item.type === "Deleted milestone stream")!;
    expect(canApplyWarningCorrection(state, warning)).toBe(false);
  });

  it("removes a deleted Stream when another valid scope remains", () => {
    const active = streamFixture();
    const deleted = streamFixture({ id: "deleted", humanId: "STREAM-002", deletion: { isDeleted: true } });
    const state = makeProjectState({ streams: [active, deleted], milestones: [{ id: "m", projectId: "project-1", humanId: "MILESTONE-001", name: "Gate", plannedDate: "2026-03-01", status: "Planned", ownerId: null, scope: { kind: "streams", streamIds: [active.id, deleted.id] }, relatedTaskIds: [], deletion: { isDeleted: false } }] });
    const warning = deriveProjectWarnings(state).find((item) => item.type === "Deleted milestone stream")!;
    expect(canApplyWarningCorrection(state, warning)).toBe(true);
    expect(warningCorrection(warning).apply(state, { createId: () => "unused", now: () => "2026-09-17T00:00:00Z" }).milestones[0].scope).toEqual({ kind: "streams", streamIds: [active.id] });
  });
});
