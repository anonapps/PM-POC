import type { ProjectState } from "../../application/state";
import { deserializeProject, serializeProject } from "../pmp";
import type { FileInformation, FileServiceResult, LoadedProject, ProjectFileHandle, ProjectFileService, SaveOptions, SaveResult } from "./types";

export interface BrowserFileSnapshot { readonly name: string; readonly size: number; readonly lastModified: number; arrayBuffer(): Promise<ArrayBuffer> }
export interface BrowserWritable { write(data: Uint8Array): Promise<void>; close(): Promise<void> }
export interface BrowserFileHandle { readonly name: string; getFile(): Promise<BrowserFileSnapshot>; createWritable(): Promise<BrowserWritable> }
export interface BrowserFileAccess { supported(): boolean; openPmp(): Promise<BrowserFileHandle | null>; savePmp(suggestedName: string): Promise<BrowserFileHandle | null> }

interface Active { readonly publicHandle: ProjectFileHandle; readonly native: BrowserFileHandle; signature?: string; createdAt?: string }
const failure = <T>(code: "UNSUPPORTED" | "CANCELLED" | "READ_FAILED" | "WRITE_FAILED" | "INVALID_PROJECT" | "EXTERNALLY_MODIFIED", message: string): FileServiceResult<T> => ({ ok: false, error: { code, message } });

export class BrowserProjectFileService implements ProjectFileService {
  private readonly active = new Map<string, Active>();
  private nextId = 1;
  constructor(private readonly access: BrowserFileAccess) {}

  async create(state: ProjectState, suggestedName: string, options: SaveOptions): Promise<FileServiceResult<LoadedProject>> { return this.saveAs(state, suggestedName, options); }
  async open(): Promise<FileServiceResult<LoadedProject>> { if (!this.access.supported()) return failure("UNSUPPORTED", "This browser does not support local project file access."); const native = await this.access.openPmp(); if (!native) return failure("CANCELLED", "Open project was cancelled."); return this.loadNative(native); }
  async saveAs(state: ProjectState, suggestedName: string, options: SaveOptions): Promise<FileServiceResult<LoadedProject>> { if (!this.access.supported()) return failure("UNSUPPORTED", "This browser does not support local project file access."); const native = await this.access.savePmp(normaliseName(suggestedName)); if (!native) return failure("CANCELLED", "Save As was cancelled."); const active = this.register(native); const saved = await this.write(active, state, options); if (!saved.ok) return saved; return this.reload(active.publicHandle); }
  async save(handle: ProjectFileHandle, state: ProjectState, options: SaveOptions): Promise<FileServiceResult<SaveResult>> { const active = this.active.get(handle.id); if (!active) return failure("READ_FAILED", "The active project file handle is no longer available."); const changed = await this.isExternallyModified(active); if (changed) return failure("EXTERNALLY_MODIFIED", "The project file changed outside the application. Choose Keep Current or Reload before saving."); return this.write(active, state, options); }
  async reload(handle: ProjectFileHandle): Promise<FileServiceResult<LoadedProject>> { const active = this.active.get(handle.id); if (!active) return failure("READ_FAILED", "The active project file handle is no longer available."); return this.loadActive(active); }
  async inspect(handle: ProjectFileHandle): Promise<FileServiceResult<FileInformation>> { const active = this.active.get(handle.id); if (!active) return failure("READ_FAILED", "The active project file handle is no longer available."); try { const file = await active.native.getFile(); return { ok: true, value: { name: file.name, size: file.size, lastModified: file.lastModified, externallyModified: active.signature !== undefined && active.signature !== signature(file) } }; } catch { return failure("READ_FAILED", "Unable to inspect the project file."); } }

  private register(native: BrowserFileHandle): Active { const publicHandle = { id: `file-${this.nextId++}`, name: native.name }; const active = { publicHandle, native }; this.active.set(publicHandle.id, active); return active; }
  private async loadNative(native: BrowserFileHandle): Promise<FileServiceResult<LoadedProject>> { return this.loadActive(this.register(native)); }
  private async loadActive(active: Active): Promise<FileServiceResult<LoadedProject>> { try { const file = await active.native.getFile(); const decoded = deserializeProject(new Uint8Array(await file.arrayBuffer())); if (!decoded.ok) return failure("INVALID_PROJECT", decoded.errors.map((e) => e.message).join(" ")); active.signature = signature(file); active.createdAt = decoded.value.manifest.createdAt; return { ok: true, value: { handle: active.publicHandle, state: decoded.value.projectState, configuration: decoded.value.configuration, createdAt: decoded.value.manifest.createdAt, lastSavedAt: decoded.value.manifest.lastSavedAt } }; } catch { return failure("READ_FAILED", "Unable to read the project file."); } }
  private async write(active: Active, state: ProjectState, options: SaveOptions): Promise<FileServiceResult<SaveResult>> { const now = new Date().toISOString(); const encoded = serializeProject(state, { createdAt: options.createdAt ?? active.createdAt ?? now, lastSavedAt: now, runtimeVersion: options.runtimeVersion, minimumRuntimeVersion: options.minimumRuntimeVersion, configuration: options.configuration }); if (!encoded.ok) return failure("INVALID_PROJECT", encoded.errors.map((e) => e.message).join(" ")); try { const writable = await active.native.createWritable(); await writable.write(encoded.value); await writable.close(); const file = await active.native.getFile(); active.signature = signature(file); active.createdAt ??= options.createdAt ?? now; return { ok: true, value: { handle: active.publicHandle, savedAt: now, bytesWritten: encoded.value.byteLength } }; } catch { return failure("WRITE_FAILED", "Unable to save the project file. Retry or use Save As."); } }
  private async isExternallyModified(active: Active): Promise<boolean> { if (!active.signature) return false; try { return signature(await active.native.getFile()) !== active.signature; } catch { return false; } }
}

function signature(file: BrowserFileSnapshot): string { return `${file.size}:${file.lastModified}`; }
function normaliseName(name: string): string { const trimmed = name.trim() || "project"; return trimmed.toLowerCase().endsWith(".pmp") ? trimmed : `${trimmed}.pmp`; }
