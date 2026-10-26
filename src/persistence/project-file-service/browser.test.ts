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

it("reuses the active identity when the picker returns the same native handle",async()=>{const access=new MemoryAccess();const service=new BrowserProjectFileService(access);const created=await service.create(makeProjectState(),"test",{runtimeVersion:"0.1.0"});expect(created.ok).toBe(true);const opened=await service.open();expect(opened.ok).toBe(true);if(created.ok&&opened.ok)expect(opened.value.handle.id).toBe(created.value.handle.id)});

it('keeps the authoritative file and successful-save metadata intact when baseline history is too large',async()=>{
 const {oversizedBaselineFixture}=await import('../../testing/oversized-baseline-fixture');
 const access=new MemoryAccess(),service=new BrowserProjectFileService(access);
 const original=makeProjectState();const created=await service.create(original,'test',{runtimeVersion:'1.6.0'});expect(created.ok).toBe(true);if(!created.ok)return;
 const before=access.handle.data.slice(),modified=access.handle.modified;let openedWriter=false;
 const writer=access.handle.createWritable.bind(access.handle);access.handle.createWritable=async()=>{openedWriter=true;return writer();};
 const saved=await service.save(created.value.handle,oversizedBaselineFixture(),{runtimeVersion:'1.6.0'});
 expect(saved.ok).toBe(false);if(!saved.ok)expect(saved.error.message).toContain('16 MiB');
 expect(openedWriter).toBe(false);expect(access.handle.data).toEqual(before);expect(access.handle.modified).toBe(modified);
 const reopened=await service.reload(created.value.handle);expect(reopened.ok).toBe(true);if(reopened.ok)expect(reopened.value.state).toEqual(created.value.state);
});
