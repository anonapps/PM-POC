import { describe, expect, it } from "vitest";
import { makeProjectState } from "../../domain/test-fixtures";
import { canonicalJson } from "./canonical";
import { deserializeProject, serializeProject } from "./codec";
import { inspectProjectCompatibility } from "./validation";
import { CURRENT_PMP_FORMAT_VERSION, CURRENT_PROJECT_SCHEMA_VERSION, PMP_FORMAT_IDENTIFIER } from "./types";

const meta = { createdAt: "2026-09-15T09:00:00.000Z", lastSavedAt: "2026-09-15T09:01:00.000Z", runtimeVersion: "0.1.0" };

describe("PMP v1", () => {
  it("canonicalises object keys", () => expect(canonicalJson({ z: 1, a: { y: 2, b: 3 } })).toBe('{"a":{"b":3,"y":2},"z":1}'));
  it("reports current compatibility", () => expect(inspectProjectCompatibility({ formatIdentifier: PMP_FORMAT_IDENTIFIER, formatVersion: CURRENT_PMP_FORMAT_VERSION, schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION })).toMatchObject({ compatible: true, requiresMigration: false }));
  it("rejects future format", () => expect(inspectProjectCompatibility({ formatIdentifier: PMP_FORMAT_IDENTIFIER, formatVersion: 2, schemaVersion: 1 }).format).toBe("UNSUPPORTED_NEWER"));
  it("rejects empty input", () => expect(deserializeProject(new Uint8Array()).ok).toBe(false));
  it("round trips representative project state", () => { const state = makeProjectState(); const encoded = serializeProject(state, meta); expect(encoded.ok).toBe(true); if (!encoded.ok) return; const decoded = deserializeProject(encoded.value); expect(decoded.ok).toBe(true); if (decoded.ok) expect(decoded.value.projectState.project.id).toBe(state.project.id); });
  it("serializes deterministically", () => { const state = makeProjectState(); const a = serializeProject(state, meta); const b = serializeProject(state, meta); expect(a.ok && b.ok && Array.from(a.value).join(",") === Array.from(b.value).join(",")).toBe(true); });
});
