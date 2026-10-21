/** Stable colour per scope name, shared by Tasks and Milestones. */
const SCOPE_COLOURS = 7;
export function scopeColourIndex(name: string): number {
  const normalized = name.trim().toLocaleLowerCase("en");
  let hash = 0;
  for (const char of normalized) hash = (Math.imul(hash, 31) + char.codePointAt(0)!) | 0;
  return (hash >>> 0) % SCOPE_COLOURS;
}
export function ScopePill({name}:{name:string}) {
  return <span className={`scope-pill scope-pill--${scopeColourIndex(name)}`} title={name} aria-label={name} tabIndex={name === "Project-wide" ? 0 : undefined}>{name === "Project-wide" ? <><span className="scope-pill-full">Project-wide</span><span className="scope-pill-short" aria-hidden="true">ALL</span></> : name}</span>;
}
