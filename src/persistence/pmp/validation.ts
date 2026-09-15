import { hydrateProjectState, type ProjectState } from "../../application/state";
import { CURRENT_PMP_FORMAT_VERSION, CURRENT_PROJECT_SCHEMA_VERSION, DEFAULT_PROJECT_CONFIGURATION, PMP_FORMAT_IDENTIFIER, type CompatibilityInspection, type LogicalPmpContainer, type PmpError, type PmpManifest, type PmpProjectConfiguration, type PmpResult, type ValidatedProjectContainer } from "./types";

const obj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const iso = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) && !Number.isNaN(Date.parse(v));
const err = (code: PmpError["code"], message: string, path?: string): PmpResult<never> => ({ ok: false, errors: [{ code, message, path }] });

export function inspectProjectCompatibility(manifest: unknown): CompatibilityInspection {
  if (!obj(manifest) || manifest.formatIdentifier !== PMP_FORMAT_IDENTIFIER || typeof manifest.formatVersion !== "number" || typeof manifest.schemaVersion !== "number") return { format: "INVALID", schema: "INVALID", compatible: false, requiresMigration: false };
  const status = (actual: number, current: number) => actual === current ? "SUPPORTED" as const : actual < current ? "UNSUPPORTED_OLDER" as const : "UNSUPPORTED_NEWER" as const;
  const format = status(manifest.formatVersion, CURRENT_PMP_FORMAT_VERSION);
  const schema = status(manifest.schemaVersion, CURRENT_PROJECT_SCHEMA_VERSION);
  return { format, schema, compatible: format === "SUPPORTED" && schema === "SUPPORTED", requiresMigration: format === "SUPPORTED" && schema === "UNSUPPORTED_OLDER" };
}

function validateManifest(v: unknown): PmpResult<PmpManifest> {
  if (!obj(v) || v.formatIdentifier !== PMP_FORMAT_IDENTIFIER || typeof v.formatVersion !== "number" || typeof v.schemaVersion !== "number" || typeof v.projectId !== "string" || !iso(v.createdAt) || !iso(v.lastSavedAt) || !obj(v.compatibility) || typeof v.compatibility.minimumRuntimeVersion !== "string" || typeof v.compatibility.createdByRuntimeVersion !== "string" || !obj(v.entries) || v.entries.project !== "project.json" || v.entries.config !== "config.json") return err("MALFORMED_MANIFEST", "Manifest is missing required PMP v1 fields.");
  return { ok: true, value: v as unknown as PmpManifest };
}

function validateConfiguration(v: unknown): PmpResult<PmpProjectConfiguration> {
  if (!obj(v) || v.weekStartsOn !== 1 || v.dateDisplayFormat !== "DD/MM/YYYY" || v.density !== "comfortable" || !obj(v.moduleVisibility)) return err("MALFORMED_CONFIGURATION", "Project configuration is invalid.");
  for (const key of Object.keys(DEFAULT_PROJECT_CONFIGURATION.moduleVisibility)) if (v.moduleVisibility[key] !== true) return err("MALFORMED_CONFIGURATION", `Invalid module visibility: ${key}.`, `moduleVisibility.${key}`);
  return { ok: true, value: v as unknown as PmpProjectConfiguration };
}

function validateState(v: unknown): PmpResult<ProjectState> {
  if (!obj(v) || !obj(v.project) || typeof v.project.id !== "string") return err("MALFORMED_PROJECT_DATA", "Project payload is invalid.");
  const arrays = ["streams", "tasks", "milestones", "people", "risks", "decisions", "relationships", "dependencies"];
  for (const key of arrays) if (!Array.isArray(v[key])) return err("SCHEMA_VALIDATION_FAILURE", `${key} must be an array.`, key);
  const prohibited = new Set(["undo", "redo", "undoStack", "redoStack", "dirty", "isDirty", "fileHandle", "filePath", "absolutePath", "session"]);
  const walk = (value: unknown): string | undefined => {
    if (Array.isArray(value)) { for (const item of value) { const found = walk(item); if (found) return found; } }
    else if (obj(value)) for (const [key, child] of Object.entries(value)) { if (prohibited.has(key)) return key; const found = walk(child); if (found) return found; }
    return undefined;
  };
  const bad = walk(v); if (bad) return err("SCHEMA_VALIDATION_FAILURE", `Prohibited persistence field: ${bad}.`, bad);
  try { return { ok: true, value: hydrateProjectState(v as unknown as Parameters<typeof hydrateProjectState>[0]) }; } catch { return err("SCHEMA_VALIDATION_FAILURE", "Project state could not be hydrated."); }
}

export function validateProjectContainer(container: LogicalPmpContainer): PmpResult<ValidatedProjectContainer> {
  const manifest = validateManifest(container.manifest); if (!manifest.ok) return manifest;
  const compatibility = inspectProjectCompatibility(manifest.value);
  if (compatibility.format === "UNSUPPORTED_NEWER" || compatibility.schema === "UNSUPPORTED_NEWER") return err("UNSUPPORTED_NEWER_VERSION", "Project requires a newer runtime.");
  if (compatibility.format === "UNSUPPORTED_OLDER") return err("UNSUPPORTED_OLDER_VERSION", "PMP format is older than supported.");
  if (compatibility.requiresMigration) return err("UNSUPPORTED_OLDER_VERSION", "Project schema requires migration.");
  const project = validateState(container.project); if (!project.ok) return project;
  if (project.value.project.id !== manifest.value.projectId) return err("PROJECT_ID_MISMATCH", "Manifest project ID does not match project payload.", "projectId");
  const configuration = validateConfiguration(container.configuration); if (!configuration.ok) return configuration;
  return { ok: true, value: { manifest: manifest.value, projectState: project.value, configuration: configuration.value } };
}
