"use client";
import { useCriticalPath } from "./provider";
export function useCriticalItems() {
  const { snapshot } = useCriticalPath();
  return new Set(!snapshot.stale && snapshot.status !== "Unavailable" ? snapshot.result?.activities.filter(a => a.criticalityReliable && a.critical).map(a => a.key) : []);
}
export function CriticalLegend() {
  return <span className="critical-path-legend"><i aria-hidden="true"/> Dark-blue outline: reliable critical item</span>;
}
