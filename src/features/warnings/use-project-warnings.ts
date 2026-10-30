"use client";
import { useMemo } from "react";
import { useCriticalPath } from "../critical-path/provider";
import { deriveProjectWarnings, type ProjectWarning } from "./warnings";
import type { ProjectState } from "../../application/state";
import type { AnalysisDiagnostic } from "../../domain/critical-path/types";

export function projectWarningProjection(state: ProjectState, diagnostics: readonly AnalysisDiagnostic[] = []): ProjectWarning[] {
  const warnings = deriveProjectWarnings(state), ids = new Set(warnings.map(w => w.id));
  const tasks = new Map(state.tasks.map(task => [task.id, task])), milestones = new Map(state.milestones.map(milestone => [milestone.id, milestone])), dependencies = new Map(state.dependencies.map(dependency => [dependency.id, dependency]));
  for (const diagnostic of diagnostics) {
    const entity = diagnostic.kind === "task" ? tasks.get(diagnostic.entityId) : milestones.get(diagnostic.entityId);
    if (!entity || entity.deletion.isDeleted) continue;
    const dependency = diagnostic.dependencyId ? dependencies.get(diagnostic.dependencyId) : undefined;
    if (diagnostic.code === "schedule" && ids.has(`fs:${diagnostic.dependencyId}`) || diagnostic.code === "reference" && ids.has(`deleted-dependency:${diagnostic.dependencyId}`) || diagnostic.code === "unscheduled" && ids.has(`task-range:${entity.id}`)) continue;
    const id = diagnostic.id;
    if (ids.has(id)) continue;
    ids.add(id);
    warnings.push({ id, severity: "warning", type: "Critical path analysis", entityType: diagnostic.kind === "task" ? "Task" : "Milestone", entityId: entity.id, humanId: entity.humanId, entityName: entity.name, description: diagnostic.description, destination: dependency && diagnostic.code !== "unscheduled" ? "Dependencies" : diagnostic.kind === "task" ? "Tasks" : "Milestones" });
  }
  return warnings;
}
export function useProjectWarnings(state: ProjectState | undefined): ProjectWarning[] {
  const { snapshot } = useCriticalPath();
  const diagnostics = snapshot.stale ? undefined : snapshot.result?.diagnostics;
  return useMemo(() => state ? projectWarningProjection(state, diagnostics) : [], [state, diagnostics]);
}
