import { DEPENDENCY_TYPES } from "../relationships";
import { calendarDate, dayNumber } from "./calendar";
import type { ActivityResult, AnalysisDiagnostic, CalculationSource, CriticalPathResult } from "./types";

interface Node { key: string; id: string; kind: "task" | "milestone"; h: number | null; streams: readonly string[]; unscheduled: boolean }
interface Edge { from: string; to: string; weight: number; ids: string[] }

/** Iterative Kosaraju traversal avoids call-stack limits on imported large graphs. */
function cycleMembers(keys: readonly string[], outgoing: Map<string, string[]>, incoming: Map<string, string[]>): Set<string> {
  const seen = new Set<string>(), order: string[] = [];
  for (const root of keys) {
    if (seen.has(root)) continue;
    const stack: [string, boolean][] = [[root, false]];
    while (stack.length) {
      const [key, finish] = stack.pop()!;
      if (finish) { order.push(key); continue; }
      if (seen.has(key)) continue;
      seen.add(key); stack.push([key, true]);
      for (const next of outgoing.get(key) ?? []) if (!seen.has(next)) stack.push([next, false]);
    }
  }
  seen.clear(); const cycles = new Set<string>();
  for (const root of order.reverse()) {
    if (seen.has(root)) continue;
    const component: string[] = [], stack = [root]; seen.add(root);
    while (stack.length) { const key = stack.pop()!; component.push(key); for (const next of incoming.get(key) ?? []) if (!seen.has(next)) { seen.add(next); stack.push(next); } }
    if (component.length > 1 || outgoing.get(root)?.includes(root)) component.forEach(key => cycles.add(key));
  }
  return cycles;
}

/** Date-level CPM: inclusive task dates, same-day FS, zero-duration linked events.
 * Scope changes the backward-pass horizon, never the global predecessor graph.
 * No clock, UI, browser, persistence or canonical-state mutations occur here.
 */
export function calculateCriticalPath(source: CalculationSource, scope: string | null = null): CriticalPathResult {
  const nodes = new Map<string, Node>(), diagnostics: AnalysisDiagnostic[] = [];
  const anchor = dayNumber(source.project.startDate);
  const linked = new Set(source.dependencies.flatMap(d => [d.predecessor, d.successor]).filter(e => e.kind === "milestone").map(e => e.id));
  for (const task of source.tasks) if (!task.deletion.isDeleted) {
    const start = dayNumber(task.startDate), finish = dayNumber(task.endDate);
    const h = start !== null && finish !== null && finish >= start ? finish - start : null;
    nodes.set(`task:${task.id}`, { key: `task:${task.id}`, id: task.id, kind: "task", h, streams: task.scope.kind === "stream" ? [task.scope.streamId] : [], unscheduled: h === null });
  }
  for (const milestone of source.milestones) if (!milestone.deletion.isDeleted && linked.has(milestone.id)) {
    const valid = dayNumber(milestone.plannedDate) !== null;
    nodes.set(`milestone:${milestone.id}`, { key: `milestone:${milestone.id}`, id: milestone.id, kind: "milestone", h: valid ? 0 : null, streams: milestone.scope.kind === "streams" ? milestone.scope.streamIds : [], unscheduled: !valid });
  }
  const tainted = new Set<string>(), outgoing = new Map<string, string[]>(), incoming = new Map<string, string[]>(), edges = new Map<string, Edge>();
  let unresolvedBoundary = anchor === null;
  for (const node of nodes.values()) if (node.h === null || anchor === null) {
    tainted.add(node.key);
    diagnostics.push({ id: `cpm:unscheduled:${node.key}`, entityId: node.id, kind: node.kind, code: "unscheduled", description: node.h === null ? "Scheduling dates are missing or invalid. Add valid planned dates to calculate this activity." : "Project Start is invalid. Correct Project Details." });
  }
  const allEntities = new Map<string, CalculationSource["tasks"][number] | CalculationSource["milestones"][number]>([...source.tasks.map(t => [`task:${t.id}`, t] as const), ...source.milestones.map(m => [`milestone:${m.id}`, m] as const)]);
  for (const dependency of source.dependencies) {
    const from = `${dependency.predecessor.kind}:${dependency.predecessor.id}`, to = `${dependency.successor.kind}:${dependency.successor.id}`;
    const a = nodes.get(from), b = nodes.get(to);
    if (!a || !b || dependency.projectId !== source.project.id || !DEPENDENCY_TYPES.includes(dependency.type)) {
      if (!a && !b) continue;
      const target = b ?? a!;
      const deleted = [from, to].some(key => allEntities.get(key)?.deletion.isDeleted);
      diagnostics.push({ id: `cpm:reference:${dependency.id}`, entityId: target.id, kind: target.kind, dependencyId: dependency.id, code: DEPENDENCY_TYPES.includes(dependency.type) ? "reference" : "type", description: deleted ? "Dependency references a deleted activity. Review the relationship." : "Dependency has an invalid type, project or missing reference. Review Dependencies." });
      if (b) tainted.add(to);
      if (!deleted || b) unresolvedBoundary = true;
      continue;
    }
    const out = outgoing.get(from) ?? [], inc = incoming.get(to) ?? []; out.push(to); inc.push(from); outgoing.set(from, out); incoming.set(to, inc);
    const startBefore = dependency.type.startsWith("Start"), startAfter = dependency.type.endsWith("Start");
    const before = allEntities.get(from)!, after = allEntities.get(to)!;
    const plannedBefore = "plannedDate" in before ? before.plannedDate : startBefore ? before.startDate : before.endDate;
    const plannedAfter = "plannedDate" in after ? after.plannedDate : startAfter ? after.startDate : after.endDate;
    if (dayNumber(plannedBefore) !== null && dayNumber(plannedAfter) !== null && plannedAfter! < plannedBefore!) diagnostics.push({ id: `cpm:schedule:${dependency.id}`, entityId: b.id, kind: b.kind, dependencyId: dependency.id, code: "schedule", description: `${dependency.type} conflicts with planned dates. Calculated dates respect dependencies; planned dates are unchanged.` });
    if (a.h === null || b.h === null) continue;
    const weight = (startBefore ? 0 : a.h) - (startAfter ? 0 : b.h);
    const key = `${from}\u0000${to}`, previous = edges.get(key);
    if (!previous || weight > previous.weight) edges.set(key, { from, to, weight, ids: [dependency.id] });
    else if (weight === previous.weight) previous.ids.push(dependency.id);
  }
  const keys = [...nodes.keys()].sort(), cycles = cycleMembers(keys, outgoing, incoming);
  for (const key of cycles) { tainted.add(key); const node = nodes.get(key)!; diagnostics.push({ id: `cpm:cycle:${key}`, entityId: node.id, kind: node.kind, code: "cycle", description: "Activity belongs to a circular dependency chain. Review Dependencies; links have not been changed." }); }
  const pending = [...tainted];
  for (let i = 0; i < pending.length; i++) for (const next of outgoing.get(pending[i]) ?? []) if (!tainted.has(next)) { tainted.add(next); pending.push(next); }
  const usable = keys.filter(key => !tainted.has(key)), degree = new Map(usable.map(key => [key, 0]));
  const edgeOut = new Map<string, Edge[]>();
  for (const edge of edges.values()) if (degree.has(edge.from) && degree.has(edge.to)) { degree.set(edge.to, degree.get(edge.to)! + 1); const list = edgeOut.get(edge.from) ?? []; list.push(edge); edgeOut.set(edge.from, list); }
  const queue = usable.filter(key => degree.get(key) === 0), es = new Map(usable.map(key => [key, anchor!]));
  for (let i = 0; i < queue.length; i++) for (const edge of edgeOut.get(queue[i]) ?? []) { es.set(edge.to, Math.max(es.get(edge.to)!, es.get(edge.from)! + edge.weight)); degree.set(edge.to, degree.get(edge.to)! - 1); if (degree.get(edge.to) === 0) queue.push(edge.to); }
  const targets = keys.filter(key => scope === null || nodes.get(key)!.streams.includes(scope));
  let globalFinish: number | null = null, finish: number | null = null;
  for (const key of usable) { const value = es.get(key)! + nodes.get(key)!.h!; globalFinish = Math.max(globalFinish ?? value, value); if (scope === null || nodes.get(key)!.streams.includes(scope)) finish = Math.max(finish ?? value, value); }
  const horizonReliable = !unresolvedBoundary && tainted.size === 0;
  const ls = new Map<string, number>();
  if (horizonReliable && globalFinish !== null && finish !== null) {
    for (const key of usable) ls.set(key, (scope === null || nodes.get(key)!.streams.includes(scope) ? finish : globalFinish) - nodes.get(key)!.h!);
    for (let i = queue.length - 1; i >= 0; i--) for (const edge of edgeOut.get(queue[i]) ?? []) ls.set(edge.from, Math.min(ls.get(edge.from)!, ls.get(edge.to)! - edge.weight));
  }
  const activities: ActivityResult[] = keys.map(key => {
    const node = nodes.get(key)!, start = es.get(key), latest = ls.get(key), reliable = start !== undefined;
    const end = reliable ? start + node.h! : null, float = latest !== undefined ? latest - start! : null;
    let free: number | null = latest !== undefined ? (scope === null || node.streams.includes(scope) ? finish! : globalFinish!) - end! : null;
    if (free !== null) for (const edge of edgeOut.get(key) ?? []) free = Math.min(free, es.get(edge.to)! - start! - edge.weight);
    return { key, id: node.id, kind: node.kind, duration: node.h === null ? null : node.kind === "milestone" ? 0 : node.h + 1, earliestStart: reliable ? calendarDate(start) : null, earliestFinish: end !== null ? calendarDate(end) : null, latestStart: latest !== undefined ? calendarDate(latest) : null, latestFinish: latest !== undefined ? calendarDate(latest + node.h!) : null, totalFloat: float, freeFloat: free, critical: float === null ? null : float === 0, datesReliable: reliable, floatReliable: float !== null, criticalityReliable: float !== null, unscheduled: node.unscheduled };
  });
  const critical = new Set(activities.filter(a => a.critical).map(a => a.key)), tightOut = new Map<string, string[]>(), tightIn = new Set<string>(), criticalLinks: string[] = [];
  for (const edge of edges.values()) if (critical.has(edge.from) && critical.has(edge.to) && es.get(edge.to) === es.get(edge.from)! + edge.weight) { const list = tightOut.get(edge.from) ?? []; list.push(edge.to); tightOut.set(edge.from, list); tightIn.add(edge.to); criticalLinks.push(...edge.ids); }
  // Count maximal entity sequences once, and scoped sequences only if they touch a target.
  const targetSet = new Set(targets), counts = new Map<string, [bigint, bigint]>();
  for (const key of queue) if (critical.has(key)) {
    let [miss, hit] = counts.get(key) ?? [BigInt(0), BigInt(0)];
    if (!tightIn.has(key)) { if (targetSet.has(key)) hit += BigInt(1); else miss += BigInt(1); }
    if (targetSet.has(key)) { hit += miss; miss = BigInt(0); }
    counts.set(key, [miss, hit]);
    for (const next of tightOut.get(key) ?? []) { const previous = counts.get(next) ?? [BigInt(0), BigInt(0)]; counts.set(next, [previous[0] + miss, previous[1] + hit]); }
  }
  let pathCount = BigInt(0);
  for (const key of critical) if (!tightOut.has(key)) pathCount += counts.get(key)?.[1] ?? BigInt(0);
  const scopedActivities = activities.filter(a => targetSet.has(a.key));
  return { scope, status: diagnostics.length || tainted.size || unresolvedBoundary ? "Partial" : "Up to date", activities: scopedActivities, criticalLinks: criticalLinks.sort(), completion: finish === null ? null : calendarDate(finish), provisional: !horizonReliable && finish !== null, criticalTaskCount: horizonReliable ? scopedActivities.filter(a => a.kind === "task" && a.critical).length : null, pathCount: horizonReliable ? pathCount.toString() : null, diagnostics: diagnostics.sort((a, b) => a.id.localeCompare(b.id)), emptyReason: !source.tasks.some(t => !t.deletion.isDeleted) ? "no-tasks" : !scopedActivities.some(a => a.datesReliable) ? "insufficient-data" : null };
}
