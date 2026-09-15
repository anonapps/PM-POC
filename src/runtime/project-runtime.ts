import { createProjectStore, type ProjectStore } from "../application";
import type { ProjectFileService, LoadedProject, ProjectFileHandle } from "../persistence/project-file-service";

export type RuntimeScreen = "launcher" | "create" | "workspace";
export interface ActiveProject { readonly store: ProjectStore; readonly handle: ProjectFileHandle; readonly loaded: LoadedProject }
export interface RuntimeSnapshot { readonly screen: RuntimeScreen; readonly active?: ActiveProject; readonly message?: string }

export class ProjectRuntime {
  private snapshot: RuntimeSnapshot = { screen: "launcher" };
  private listeners = new Set<() => void>();
  constructor(private readonly files: ProjectFileService) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  beginNewProject() { this.set({ screen: "create" }); }
  cancelNewProject() { this.set({ screen: "launcher" }); }
  async openProject() {
    const result = await this.files.open();
    if (!result.ok) {
      if (result.error.code !== "CANCELLED") this.set({ screen: "launcher", message: result.error.message });
      return result;
    }
    if (this.snapshot.active?.handle.id === result.value.handle.id) return result;
    this.activate(result.value);
    return result;
  }
  activate(loaded: LoadedProject) {
    const store = createProjectStore(loaded.state, { createId: () => crypto.randomUUID(), now: () => new Date().toISOString() });
    this.set({ screen: "workspace", active: { store, handle: loaded.handle, loaded } });
  }
  async createProject(state: import("../application").ProjectState, suggestedName: string) { const result = await this.files.create(state, suggestedName, { runtimeVersion: "0.1.0" }); if (result.ok) this.activate(result.value); return result; }
  closeProject() { this.set({ screen: "launcher" }); }
  get fileService() { return this.files; }
  private set(snapshot: RuntimeSnapshot) { this.snapshot = snapshot; this.listeners.forEach((listener) => listener()); }
}
