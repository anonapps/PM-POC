import { expect, it } from "vitest";
import type { Dependency, Task } from "../index";
import { makeProjectState, projectFixture, taskFixture } from "../test-fixtures";
import { calculateCriticalPath } from "./calculate";

const anchor = "2026-10-01";
const day = 86_400_000;
const iso = (n: number) => new Date(Date.parse(anchor) + n * day).toISOString().slice(0, 10);
const ordinal = (date: string) => (Date.parse(date) - Date.parse(anchor)) / day;

function task(id: string, length = 2, streamId = "design"): Task {
  return taskFixture({id, name: id, startDate: anchor, endDate: iso(length - 1), scope: {kind: "stream", streamId}});
}

function link(from: string, to: string, type: Dependency["type"] = "Finish-to-Start", id = `${from}-${to}-${type}`): Dependency {
  return {id, projectId: "project-1", type, predecessor: {kind: "task", id: from}, successor: {kind: "task", id: to}};
}

function source(tasks: Task[], dependencies: Dependency[]) {
  return makeProjectState({project: projectFixture({startDate: anchor}), tasks, dependencies});
}

/** Independent oracle for fully scheduled DAGs. Relax endpoint inequalities directly
 * in arbitrary input order; keep duplicate records and deduplicate matching sequences. */
function reference(tasks: Task[], links: Dependency[], scope?: string) {
  const active = tasks.filter(task => !task.deletion.isDeleted);
  const byId = new Map(active.map(task => [task.id, task]));
  const finishOffset = new Map(active.map(task => [task.id, ordinal(task.endDate!) - ordinal(task.startDate!)]));
  const targets = active.filter(task => scope === undefined || task.scope.kind === "stream" && task.scope.streamId === scope);
  const targetIds = new Set(targets.map(task => task.id));
  const edges = links.flatMap(link => {
    const from = link.predecessor.id, to = link.successor.id;
    if (!byId.has(from) || !byId.has(to)) return [];
    const [fromEvent, toEvent] = link.type.split("-to-");
    return [{from, to, fromOffset: fromEvent === "Finish" ? finishOffset.get(from)! : 0,
      toOffset: toEvent === "Finish" ? finishOffset.get(to)! : 0}];
  });
  const early = new Map(active.map(task => [task.id, 0]));
  for (let pass = 0; pass < active.length; pass++) {
    for (const {from, to, fromOffset, toOffset} of edges) {
      early.set(to, Math.max(early.get(to)!, early.get(from)! + fromOffset - toOffset));
    }
  }
  const finish = (group: Task[]) => Math.max(...group.map(task => early.get(task.id)! + finishOffset.get(task.id)!));
  const finishGlobal = finish(active), finishScope = finish(targets);
  const bound = (id: string) => targetIds.has(id) ? finishScope : finishGlobal;
  const late = new Map(active.map(({id}) => [id, bound(id) - finishOffset.get(id)!]));
  for (let pass = 0; pass < active.length; pass++) {
    for (const {from, to, fromOffset, toOffset} of edges) {
      late.set(from, Math.min(late.get(from)!, late.get(to)! + toOffset - fromOffset));
    }
  }
  const slack = ({from, to, fromOffset, toOffset}: typeof edges[number]) =>
    early.get(to)! + toOffset - early.get(from)! - fromOffset;
  const critical = active.map(task => task.id).filter(id => late.get(id) === early.get(id));
  const tight = edges.filter(edge => critical.includes(edge.from) && critical.includes(edge.to) && slack(edge) === 0);
  const successors = (id: string) => [...new Set(tight.filter(edge => edge.from === id).map(edge => edge.to))];
  const roots = critical.filter(id => !tight.some(edge => edge.to === id));
  const rows = targets.map(({id}) => ({
    id, earliestStart: iso(early.get(id)!), latestStart: iso(late.get(id)!),
    totalFloat: late.get(id)! - early.get(id)!,
    freeFloat: Math.min(bound(id) - early.get(id)! - finishOffset.get(id)!, ...edges.filter(edge => edge.from === id).map(slack)),
    critical: critical.includes(id),
  }));
  return {targets: targetIds, roots, successors, rows, completion: iso(finishScope)};
}

type Reference = ReturnType<typeof reference>;
function enumerate(graph: Reference, prefix: string[], id: string): string[][] {
  const sequence = [...prefix, id], next = graph.successors(id);
  if (!next.length) return sequence.some(item => graph.targets.has(item)) ? [sequence] : [];
  return next.flatMap(item => enumerate(graph, sequence, item));
}

const fork = [link("a", "b"), link("a", "c"), link("b", "d"), link("c", "d")];
const mixed = [
  link("b", "c", "Finish-to-Finish"),
  link("a", "c", "Start-to-Finish"),
  link("a", "b", "Start-to-Start"),
  link("c", "d", "Finish-to-Start"),
  link("c", "d", "Start-to-Start"),
];
const cases = [
  {label: "linear", ids: "abc", edges: [link("a", "b"), link("b", "c")], expected: 1},
  {label: "parallel and disconnected", ids: "abcde", edges: [link("a", "b"), link("c", "d")], expected: 2},
  {label: "branching and merging with shared tasks", ids: "abcd", edges: fork, expected: 2},
  {label: "duplicate and equivalent edges", ids: "abcd", edges: [...fork, link("a", "b", "Finish-to-Start", "duplicate")], expected: 2},
  {label: "noncritical branch and independent group", ids: "abcdef", edges: [...fork, link("a", "e")], expected: 2},
  {label: "mixed endpoints with zero stored lag", ids: "abcd", edges: mixed, expected: 1},
  {label: "stream horizon with cross-stream dependencies", ids: "abcde", edges: [...fork, link("a", "e")], scope: "docs", expected: 1},
];

it.each(cases)("agrees with the independent oracle for $label", ({ids, edges, scope, expected}) => {
  const tasks = [...ids].map(id => ({...task(id, 2, id === "e" ? "docs" : "design"),
    ...(id === "a" ? {status: "Completed" as const, actualCompletionDate: iso(9)} : {})}));
  const graph = reference(tasks, edges, scope);
  const sequences = graph.roots.flatMap(id => enumerate(graph, [], id));
  expect(sequences).toHaveLength(expected);
  const actual = calculateCriticalPath(source(tasks, edges), scope);
  expect(actual).toMatchObject({
    completion: graph.completion, criticalTaskCount: graph.rows.filter(row => row.critical).length, pathCount: String(sequences.length),
  });
  for (const row of graph.rows) expect(actual.activities.find(item => item.id === row.id)).toMatchObject(row);
});

it("checks the 69 / 45 / 49,152 totals on a representative network using an independent suffix count", () => {
  // Complete bipartite boundaries multiply the number of possible sequences.
  const sizes = [3, ...Array<number>(14).fill(2), ...Array<number>(14).fill(1)];
  const layers = sizes.map((size, layer) => Array.from({length: size}, (_, index) => task(`${layer}:${index}`)));
  const tasks = [...layers.flat(), ...Array.from({length: 24}, (_, index) => task(`short:${index}`, 1))];
  const edges = layers.slice(1).flatMap((layer, index) =>
    layers[index].flatMap(from => layer.map(to => link(from.id, to.id))));
  const graph = reference(tasks, edges);
  const cache = new Map<string, bigint>();
  function countSuffixes(id: string): bigint {
    const cached = cache.get(id);
    if (cached !== undefined) return cached;
    const next = graph.successors(id);
    const count = next.length ? next.reduce((total, item) => total + countSuffixes(item), BigInt(0)) : BigInt(1);
    cache.set(id, count);
    return count;
  }
  const count = graph.roots.reduce((total, root) => total + countSuffixes(root), BigInt(0));
  expect(count).toBe(BigInt(sizes.reduce((total, size) => total * size, 1)));
  expect(tasks).toHaveLength(69);
  expect(calculateCriticalPath(source(tasks, edges))).toMatchObject({criticalTaskCount: 45, pathCount: count.toString()});
  expect(count.toString()).toBe("49152");
});

it("deduplicates different binding dependency types and counts an isolated critical task", () => {
  const tasks = ["a", "b", "c"].map(id => task(id, 1));
  const edges = [link("a", "b"), link("a", "b", "Start-to-Finish"), link("a", "b", "Finish-to-Finish")];
  const graph = reference(tasks, edges);
  expect(graph.roots.flatMap(id => enumerate(graph, [], id))).toEqual([["a", "b"], ["c"]]);
  expect(calculateCriticalPath(source(tasks, edges)).pathCount).toBe("2");
});

it("excludes a deleted successor while retaining the independently verified paths", () => {
  const tasks = [task("a"), task("b"), {...task("c"), deletion: {isDeleted: true}}];
  const links = [link("a", "b"), link("b", "c")];
  const graph = reference(tasks, links);
  const result = calculateCriticalPath(source(tasks, links));
  expect(result).toMatchObject({status: "Partial", completion: graph.completion, provisional: false, pathCount: "1"});
  expect(result.activities.map(activity => activity.id)).toEqual(["a", "b"]);
  expect(graph.roots.flatMap(id => enumerate(graph, [], id))).toEqual([["a", "b"]]);
});

it("keeps independent dates but withholds float and paths when cycles or unscheduled predecessors can change completion", () => {
  const common = [task("a"), task("b"), task("c"), task("d")];
  const scenarios = [
    {tasks: common, edges: [link("a", "b"), link("b", "a"), link("b", "c")], cycleIds: ["a", "b"]},
    {tasks: [{...common[0], startDate: null}, ...common.slice(1)], edges: [link("a", "b"), link("b", "c")], cycleIds: []},
  ];
  const unaffected = reference([task("d")], []);
  for (const {tasks, edges, cycleIds} of scenarios) {
    const result = calculateCriticalPath(source(tasks, edges));
    expect(result).toMatchObject({completion: unaffected.completion, provisional: true, pathCount: null, criticalTaskCount: null});
    expect(result.diagnostics.filter(item => item.code === "cycle").map(item => item.entityId)).toEqual(cycleIds);
    for (const id of ["a", "b", "c"]) expect(result.activities.find(item => item.id === id)).toMatchObject({datesReliable: false});
    expect(result.activities.find(item => item.id === "d")).toMatchObject({
      earliestStart: unaffected.rows[0].earliestStart, datesReliable: true, floatReliable: false, criticalityReliable: false,
    });
  }
});
