import type { ProjectState } from "../../application/state";

export const PMP_FORMAT_IDENTIFIER = "PM-POC/PMP" as const;
export const CURRENT_PMP_FORMAT_VERSION = 1 as const;
export const CURRENT_PROJECT_SCHEMA_VERSION = 2 as const;
export const SUPPORTED_PMP_FORMAT_VERSIONS = [1] as const;
export const SUPPORTED_PROJECT_SCHEMA_VERSIONS = [1, 2] as const;
export const PMP_ENTRY_NAMES = ["manifest.json", "project.json", "config.json"] as const;

export interface PmpManifest {
  readonly formatIdentifier: typeof PMP_FORMAT_IDENTIFIER;
  readonly formatVersion: number;
  readonly schemaVersion: number;
  readonly projectId: string;
  readonly createdAt: string;
  readonly lastSavedAt: string;
  readonly compatibility: { readonly minimumRuntimeVersion: string; readonly createdByRuntimeVersion: string };
  readonly entries: { readonly project: "project.json"; readonly config: "config.json" };
}

export interface PmpProjectConfiguration {
  readonly weekStartsOn: 1;
  readonly dateDisplayFormat: "DD/MM/YYYY";
  readonly density: "comfortable";
  readonly moduleVisibility: { readonly streams: true; readonly people: true; readonly tasks: true; readonly milestones: true; readonly gantt: true; readonly tubeMap: true; readonly risks: true; readonly decisions: true };
}

export const DEFAULT_PROJECT_CONFIGURATION: PmpProjectConfiguration = Object.freeze({
  weekStartsOn: 1,
  dateDisplayFormat: "DD/MM/YYYY",
  density: "comfortable",
  moduleVisibility: Object.freeze({ streams: true, people: true, tasks: true, milestones: true, gantt: true, tubeMap: true, risks: true, decisions: true }),
});

export interface SerializeProjectMetadata { readonly createdAt: string; readonly lastSavedAt: string; readonly runtimeVersion: string; readonly minimumRuntimeVersion?: string; readonly configuration?: PmpProjectConfiguration }
export type CompatibilityStatus = "SUPPORTED" | "UNSUPPORTED_OLDER" | "UNSUPPORTED_NEWER" | "INVALID";
export type PmpErrorCode = "INVALID_CONTAINER" | "MISSING_ENTRY" | "UNEXPECTED_ENTRY" | "MALFORMED_MANIFEST" | "MALFORMED_PROJECT_DATA" | "MALFORMED_CONFIGURATION" | "UNSUPPORTED_OLDER_VERSION" | "UNSUPPORTED_NEWER_VERSION" | "PROJECT_ID_MISMATCH" | "SCHEMA_VALIDATION_FAILURE" | "MIGRATION_FAILURE";
export interface PmpError { readonly code: PmpErrorCode; readonly message: string; readonly path?: string }
export type PmpResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly errors: readonly PmpError[] };
export interface ValidatedProjectContainer { readonly manifest: PmpManifest; readonly projectState: ProjectState; readonly configuration: PmpProjectConfiguration }
export interface CompatibilityInspection { readonly format: CompatibilityStatus; readonly schema: CompatibilityStatus; readonly compatible: boolean; readonly requiresMigration: boolean }
export interface LogicalPmpContainer { readonly manifest: unknown; readonly project: unknown; readonly configuration: unknown }
