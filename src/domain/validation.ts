import type { Project, Stream, Task } from "./entities";
import { getTaskHierarchyDepth, MAX_TASK_HIERARCHY_DEPTH } from "./tasks";
import type { InternalId, LocalDate } from "./types";

export const VALIDATION_SEVERITIES = ["critical", "warning"] as const;
export type ValidationSeverity = (typeof VALIDATION_SEVERITIES)[number];

export interface ValidationIssue {
  readonly code: string;
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly entityId: InternalId;
}

export function validateRequiredText(
  entityId: InternalId,
  field: string,
  value: string,
): readonly ValidationIssue[] {
  return value.trim().length === 0
    ? [{
        code: `${field}.required`,
        severity: "critical",
        message: `${field} is required.`,
        entityId,
      }]
    : [];
}

export function validateProgress(
  entityId: InternalId,
  progress: number,
): readonly ValidationIssue[] {
  return Number.isInteger(progress) && progress >= 0 && progress <= 100
    ? []
    : [{
        code: "progress.invalid",
        severity: "critical",
        message: "Progress must be a whole number from 0 to 100.",
        entityId,
      }];
}

export function validateProjectDates(project: Project): readonly ValidationIssue[] {
  return invalidRange(project.startDate, project.endDate)
    ? [{
        code: "project.invalid-date-range",
        severity: "critical",
        message: "Project Start Date must not be after Project End Date.",
        entityId: project.id,
      }]
    : [];
}

export function validateStreamDates(
  stream: Stream,
  project: Project,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (invalidRange(stream.startDate, stream.endDate)) {
    issues.push(dateWarning("stream.invalid-date-range", stream.id, "Stream Start Date is after Stream End Date."));
  }
  if (outsideRange(stream.startDate, project.startDate, project.endDate) || outsideRange(stream.endDate, project.startDate, project.endDate)) {
    issues.push(dateWarning("stream.outside-project-dates", stream.id, "Stream dates are outside the Project date range."));
  }
  return issues;
}

export function validateTaskDates(
  task: Task,
  project: Project,
  stream?: Stream,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (invalidRange(task.startDate, task.endDate)) {
    issues.push(dateWarning("task.invalid-date-range", task.id, "Task Start Date is after Task End Date."));
  }
  if (outsideRange(task.startDate, project.startDate, project.endDate) || outsideRange(task.endDate, project.startDate, project.endDate)) {
    issues.push(dateWarning("task.outside-project-dates", task.id, "Task dates are outside the Project date range."));
  }
  if (stream && (outsideRange(task.startDate, stream.startDate, stream.endDate) || outsideRange(task.endDate, stream.startDate, stream.endDate))) {
    issues.push(dateWarning("task.outside-stream-dates", task.id, "Task dates are outside the Stream date range."));
  }
  return issues;
}

export function validateMilestoneDate(
  milestoneId: InternalId,
  plannedDate: LocalDate,
  project: Project,
): readonly ValidationIssue[] {
  return outsideRange(plannedDate, project.startDate, project.endDate)
    ? [dateWarning("milestone.outside-project-dates", milestoneId, "Milestone date is outside the Project date range.")]
    : [];
}

export function validateTaskHierarchy(
  taskId: string,
  tasks: readonly Task[],
): readonly ValidationIssue[] {
  const depth = getTaskHierarchyDepth(taskId, tasks);
  if (depth !== null && depth <= MAX_TASK_HIERARCHY_DEPTH) return [];
  return [{
    code: depth === null ? "task.invalid-parent-chain" : "task.maximum-depth-exceeded",
    severity: "critical",
    message: depth === null ? "Task hierarchy contains a missing parent or cycle." : `Task hierarchy cannot exceed ${MAX_TASK_HIERARCHY_DEPTH} levels.`,
    entityId: taskId,
  }];
}

function invalidRange(start?: LocalDate, end?: LocalDate): boolean {
  return Boolean(start && end && start > end);
}

function outsideRange(date?: LocalDate, start?: LocalDate, end?: LocalDate): boolean {
  return Boolean(date && ((start && date < start) || (end && date > end)));
}

function dateWarning(code: string, entityId: InternalId, message: string): ValidationIssue {
  return { code, severity: "warning", message, entityId };
}
