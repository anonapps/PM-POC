import type { ProjectState } from "../../application/state";

export type CalculationSource = Pick<ProjectState, "project" | "tasks" | "milestones" | "dependencies" | "streams">;
export type CalculationStatus = "Calculating" | "Up to date" | "Partial" | "Unavailable";
export interface AnalysisDiagnostic {
  id: string;
  entityId: string;
  kind: "task" | "milestone";
  dependencyId?: string;
  code: "unscheduled" | "reference" | "cycle" | "type" | "schedule";
  description: string;
}
export interface ActivityResult {
  key: string;
  id: string;
  kind: "task" | "milestone";
  duration: number | null;
  earliestStart: string | null;
  earliestFinish: string | null;
  latestStart: string | null;
  latestFinish: string | null;
  totalFloat: number | null;
  freeFloat: number | null;
  critical: boolean | null;
  datesReliable: boolean;
  floatReliable: boolean;
  criticalityReliable: boolean;
  unscheduled: boolean;
}
export interface CriticalPathResult {
  scope: string | null;
  status: "Up to date" | "Partial";
  activities: readonly ActivityResult[];
  criticalLinks: readonly string[];
  completion: string | null;
  provisional: boolean;
  criticalTaskCount: number | null;
  pathCount: string | null;
  diagnostics: readonly AnalysisDiagnostic[];
  emptyReason: "no-tasks" | "insufficient-data" | null;
}
