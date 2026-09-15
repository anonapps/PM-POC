import type { ProjectState } from "../../application/state";
import { canonicalJson } from "./canonical";
import { validateProjectContainer } from "./validation";
import { CURRENT_PMP_FORMAT_VERSION, CURRENT_PROJECT_SCHEMA_VERSION, DEFAULT_PROJECT_CONFIGURATION, PMP_ENTRY_NAMES, PMP_FORMAT_IDENTIFIER, type LogicalPmpContainer, type PmpError, type PmpResult, type SerializeProjectMetadata, type ValidatedProjectContainer } from "./types";

const enc = new TextEncoder();
const dec = new TextDecoder("utf-8", { fatal: true });
const MAX_ARCHIVE = 32 * 1024 * 1024;
const MAX_ENTRY = 16 * 1024 * 1024;
const MAX_ENTRIES = 3;
const fail = (code: PmpError["code"], message: string): PmpResult<never> => ({ ok: false, errors: [{ code, message }] });

function crc32(data: Uint8Array): number { let c = 0xffffffff; for (const b of data) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return (c ^ 0xffffffff) >>> 0; }
function u16(a: number[], n: number) { a.push(n & 255, (n >>> 8) & 255); }
function u32(a: number[], n: number) { a.push(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255); }
function deflateStored(data: Uint8Array): Uint8Array { const out: number[] = []; let p = 0; while (p < data.length || data.length === 0 && p === 0) { const len = Math.min(65535, data.length - p); const final = p + len >= data.length; out.push(final ? 1 : 0); u16(out, len); u16(out, (~len) & 0xffff); for (let i = 0; i < len; i++) out.push(data[p + i]); p += len; if (final) break; } return Uint8Array.from(out); }
function inflateStored(data: Uint8Array, expected: number): Uint8Array { const out: number[] = []; let p = 0; while (p < data.length) { const header = data[p++]; const final = (header & 1) === 1; const type = (header >>> 1) & 3; if (type !== 0 || p + 4 > data.length) throw new Error("unsupported deflate block"); const len = data[p] | data[p + 1] << 8; const nlen = data[p + 2] | data[p + 3] << 8; p += 4; if (((len ^ nlen) & 0xffff) !== 0xffff || p + len > data.length) throw new Error("invalid deflate block"); for (let i = 0; i < len; i++) out.push(data[p + i]); p += len; if (final) break; } if (out.length !== expected) throw new Error("size mismatch"); return Uint8Array.from(out); }

function zip(entries: Record<string, Uint8Array>): Uint8Array {
  const local: number[] = [], central: number[] = []; let offset = 0;
  for (const name of PMP_ENTRY_NAMES) { const raw = entries[name]; const nameBytes = enc.encode(name); const compressed = deflateStored(raw); const crc = crc32(raw); const start = local.length; u32(local, 0x04034b50); u16(local, 20); u16(local, 0); u16(local, 8); u16(local, 0); u16(local, 0); u32(local, crc); u32(local, compressed.length); u32(local, raw.length); u16(local, nameBytes.length); u16(local, 0); local.push(...nameBytes, ...compressed); u32(central, 0x02014b50); u16(central, 20); u16(central, 20); u16(central, 0); u16(central, 8); u16(central, 0); u16(central, 0); u32(central, crc); u32(central, compressed.length); u32(central, raw.length); u16(central, nameBytes.length); u16(central, 0); u16(central, 0); u16(central, 0); u16(central, 0); u32(central, 0); u32(central, offset); central.push(...nameBytes); offset += local.length - start; }
  const out = [...local, ...central]; u32(out, 0x06054b50); u16(out, 0); u16(out, 0); u16(out, PMP_ENTRY_NAMES.length); u16(out, PMP_ENTRY_NAMES.length); u32(out, central.length); u32(out, local.length); u16(out, 0); return Uint8Array.from(out);
}

function unzip(bytes: Uint8Array): PmpResult<Record<string, Uint8Array>> {
  if (bytes.length === 0 || bytes.length > MAX_ARCHIVE) return fail("INVALID_CONTAINER", "PMP archive is empty or exceeds the size limit.");
  const result: Record<string, Uint8Array> = {}; let p = 0, count = 0;
  try { while (p + 4 <= bytes.length && (bytes[p] | bytes[p+1]<<8 | bytes[p+2]<<16 | bytes[p+3]<<24) === 0x04034b50) { count++; if (count > MAX_ENTRIES) return fail("UNEXPECTED_ENTRY", "Too many archive entries."); const method = bytes[p+8] | bytes[p+9]<<8; const compressed = (bytes[p+18] | bytes[p+19]<<8 | bytes[p+20]<<16 | bytes[p+21]<<24) >>> 0; const size = (bytes[p+22] | bytes[p+23]<<8 | bytes[p+24]<<16 | bytes[p+25]<<24) >>> 0; const nameLen = bytes[p+26] | bytes[p+27]<<8; const extraLen = bytes[p+28] | bytes[p+29]<<8; if (size > MAX_ENTRY || method !== 8) return fail("INVALID_CONTAINER", "Unsupported or oversized archive entry."); const name = dec.decode(bytes.slice(p+30, p+30+nameLen)); if (name.includes("/") || name.includes("\\") || name.includes("..") || !PMP_ENTRY_NAMES.includes(name as (typeof PMP_ENTRY_NAMES)[number])) return fail("UNEXPECTED_ENTRY", "Unsafe or unexpected archive entry."); if (result[name]) return fail("UNEXPECTED_ENTRY", "Duplicate archive entry."); const start = p+30+nameLen+extraLen; result[name] = inflateStored(bytes.slice(start, start+compressed), size); p = start+compressed; }
  } catch { return fail("INVALID_CONTAINER", "Malformed PMP ZIP container."); }
  for (const name of PMP_ENTRY_NAMES) if (!result[name]) return fail("MISSING_ENTRY", `Missing required entry: ${name}.`); return { ok: true, value: result };
}

export function serializeProject(state: ProjectState, metadata: SerializeProjectMetadata): PmpResult<Uint8Array> {
  const manifest = { formatIdentifier: PMP_FORMAT_IDENTIFIER, formatVersion: CURRENT_PMP_FORMAT_VERSION, schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION, projectId: state.project.id, createdAt: metadata.createdAt, lastSavedAt: metadata.lastSavedAt, compatibility: { minimumRuntimeVersion: metadata.minimumRuntimeVersion ?? metadata.runtimeVersion, createdByRuntimeVersion: metadata.runtimeVersion }, entries: { project: "project.json" as const, config: "config.json" as const } };
  const configuration = metadata.configuration ?? DEFAULT_PROJECT_CONFIGURATION;
  const validated = validateProjectContainer({ manifest, project: state, configuration }); if (!validated.ok) return validated;
  return { ok: true, value: zip({ "manifest.json": enc.encode(canonicalJson(manifest)), "project.json": enc.encode(canonicalJson(state)), "config.json": enc.encode(canonicalJson(configuration)) }) };
}

export function deserializeProject(bytes: Uint8Array): PmpResult<ValidatedProjectContainer> {
  const archive = unzip(bytes); if (!archive.ok) return archive;
  try { const logical: LogicalPmpContainer = { manifest: JSON.parse(dec.decode(archive.value["manifest.json"])), project: JSON.parse(dec.decode(archive.value["project.json"])), configuration: JSON.parse(dec.decode(archive.value["config.json"])) }; return validateProjectContainer(logical); } catch { return fail("INVALID_CONTAINER", "PMP entries are not valid UTF-8 JSON."); }
}
