import type { ProjectState } from "../../application/state";
import type { PmpProjectConfiguration } from "../pmp";

export type ProjectFileErrorCode = "UNSUPPORTED" | "CANCELLED" | "PERMISSION_DENIED" | "READ_FAILED" | "WRITE_FAILED" | "INVALID_PROJECT" | "EXTERNALLY_MODIFIED";
export interface ProjectFileError { readonly code: ProjectFileErrorCode; readonly message: string }
export type FileServiceResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: ProjectFileError };
export interface ProjectFileHandle { readonly id: string; readonly name: string }
export interface FileInformation { readonly name: string; readonly size: number; readonly lastModified: number; readonly externallyModified: boolean }
export interface LoadedProject { readonly handle: ProjectFileHandle; readonly state: ProjectState; readonly configuration: PmpProjectConfiguration; readonly createdAt: string; readonly lastSavedAt: string }
export interface SaveResult { readonly handle: ProjectFileHandle; readonly savedAt: string; readonly bytesWritten: number }
export interface SaveOptions { readonly runtimeVersion: string; readonly minimumRuntimeVersion?: string; readonly configuration?: PmpProjectConfiguration; readonly createdAt?: string }

export interface ProjectFileService {
  create(state: ProjectState, suggestedName: string, options: SaveOptions): Promise<FileServiceResult<LoadedProject>>;
  open(): Promise<FileServiceResult<LoadedProject>>;
  save(handle: ProjectFileHandle, state: ProjectState, options: SaveOptions): Promise<FileServiceResult<SaveResult>>;
  saveAs(state: ProjectState, suggestedName: string, options: SaveOptions): Promise<FileServiceResult<LoadedProject>>;
  reload(handle: ProjectFileHandle): Promise<FileServiceResult<LoadedProject>>;
  inspect(handle: ProjectFileHandle): Promise<FileServiceResult<FileInformation>>;
  acceptExternalModification(handle: ProjectFileHandle): Promise<FileServiceResult<FileInformation>>;
}
