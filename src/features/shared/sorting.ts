/** Consistent, stable, display-only sorting for project tables. */
export type SortDirection = "asc" | "desc";
export interface SortSelection<K extends string> { key: K; direction: SortDirection }
export function nextSort<K extends string>(previous: SortSelection<K> | null, key: K): SortSelection<K> {
  return { key, direction: previous?.key === key && previous.direction === "asc" ? "desc" : "asc" };
}
export function compareSortValues(left: string | number | null | undefined, right: string | number | null | undefined, direction: SortDirection = "asc"): number {
  const missing = (value: typeof left) => value === null || value === undefined || value === "";
  if (missing(left) || missing(right)) return missing(left) === missing(right) ? 0 : missing(left) ? 1 : -1;
  const comparison = typeof left === "number" && typeof right === "number"
    ? left - right
    : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
  return comparison * (direction === "asc" ? 1 : -1);
}
export function sortRows<T, K extends string>(rows: readonly T[], selection: SortSelection<K> | null, value: (row: T, key: K) => string | number | null | undefined): T[] {
  if (!selection) return [...rows];
  return rows.map((row, index) => ({row, index})).sort((a, b) =>
    compareSortValues(value(a.row, selection.key), value(b.row, selection.key), selection.direction) || a.index - b.index
  ).map(({row}) => row);
}
