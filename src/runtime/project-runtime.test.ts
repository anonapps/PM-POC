import { describe, expect, it } from "vitest";
import { ProjectRuntime } from "./project-runtime";
import type { ProjectFileService } from "../persistence/project-file-service";

const files = (open: ProjectFileService["open"]): ProjectFileService => ({ open, create: async () => { throw new Error() }, save: async () => { throw new Error() }, saveAs: async () => { throw new Error() }, reload: async () => { throw new Error() }, inspect: async () => { throw new Error() } });
describe("ProjectRuntime", () => {
  it("starts in the launcher and transitions to/cancels creation", () => { const runtime = new ProjectRuntime(files(async () => ({ ok: false, error: { code: "CANCELLED", message: "cancelled" } }))); expect(runtime.getSnapshot().screen).toBe("launcher"); runtime.beginNewProject(); expect(runtime.getSnapshot().screen).toBe("create"); runtime.cancelNewProject(); expect(runtime.getSnapshot().screen).toBe("launcher"); });
  it("keeps cancellation quiet and reports unsupported/invalid files", async () => { const cancelled = new ProjectRuntime(files(async () => ({ ok: false, error: { code: "CANCELLED", message: "cancelled" } }))); await cancelled.openProject(); expect(cancelled.getSnapshot().message).toBeUndefined(); const invalid = new ProjectRuntime(files(async () => ({ ok: false, error: { code: "INVALID_PROJECT", message: "Invalid PMP" } }))); await invalid.openProject(); expect(invalid.getSnapshot().message).toBe("Invalid PMP"); });
  it("returns to launcher on close", () => { const runtime = new ProjectRuntime(files(async () => ({ ok: false, error: { code: "UNSUPPORTED", message: "unsupported" } }))); runtime.beginNewProject(); runtime.closeProject(); expect(runtime.getSnapshot()).toEqual({ screen: "launcher" }); });
});
