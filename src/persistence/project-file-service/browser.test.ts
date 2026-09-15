import { describe, expect, it } from "vitest";
import { makeProjectState } from "../../domain/test-fixtures";
import { BrowserProjectFileService, type BrowserFileAccess, type BrowserFileHandle, type BrowserFileSnapshot, type BrowserWritable } from "./browser";

class MemoryHandle implements BrowserFileHandle {
  data = new Uint8Array(); modified = 1;
  constructor(readonly name: string) {}
  async getFile(): Promise<BrowserFileSnapshot> { const copy = this.data.slice(); return { name: this.name, size: copy.length, lastModified: this.modified, arrayBuffer: async () => copy.buffer }; }
  async createWritable(): Promise<BrowserWritable> { return { write: async (data) => { this.data = data.slice(); }, close: async () => { this.modified++; } }; }
}
class MemoryAccess implements BrowserFileAccess {
  handle = new MemoryHandle("test.pmp"); enabled = true;
  supported() { return this.enabled; }
  async openPmp() { return this.handle; }
  async savePmp() { return this.handle; }
}

describe("BrowserProjectFileService", () => {
  it("creates, reloads and inspects a project", async () => { const access = new MemoryAccess(); const service = new BrowserProjectFileService(access); const created = await service.create(makeProjectState(), "test", { runtimeVersion: "0.1.0" }); expect(created.ok).toBe(true); if (!created.ok) return; const info = await service.inspect(created.value.handle); expect(info.ok && info.value.name).toBe("test.pmp"); const reloaded = await service.reload(created.value.handle); expect(reloaded.ok).toBe(true); });
  it("detects external modification before overwrite", async () => { const access = new MemoryAccess(); const service = new BrowserProjectFileService(access); const created = await service.create(makeProjectState(), "test", { runtimeVersion: "0.1.0" }); expect(created.ok).toBe(true); if (!created.ok) return; access.handle.modified += 10; const saved = await service.save(created.value.handle, makeProjectState(), { runtimeVersion: "0.1.0" }); expect(saved.ok).toBe(false); if (!saved.ok) expect(saved.error.code).toBe("EXTERNALLY_MODIFIED"); });
  it("reports unsupported capability", async () => { const access = new MemoryAccess(); access.enabled = false; const service = new BrowserProjectFileService(access); const opened = await service.open(); expect(opened.ok).toBe(false); if (!opened.ok) expect(opened.error.code).toBe("UNSUPPORTED"); });
});
