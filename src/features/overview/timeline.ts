import type { ProjectState } from "../../application";

export interface OverviewTimelineRow {
  id: string;
  name: string;
  start?: string;
  end?: string;
  unscheduled: number;
}

/** The same milestone may affect several streams, but is one project record. */
export function deriveOverviewTimeline(state: ProjectState) {
  const tasks = state.tasks.filter(task => !task.deletion.isDeleted);
  const milestones = state.milestones.filter(milestone => !milestone.deletion.isDeleted);
  const streams = state.streams.filter(stream => !stream.deletion.isDeleted);
  const dates = (values: readonly string[]) => ({
    start: [...values].sort()[0],
    end: [...values].sort().at(-1),
  });
  const rows: OverviewTimelineRow[] = streams.map(stream => {
    const assignedTasks = tasks.filter(task => task.scope.kind === "stream" && task.scope.streamId === stream.id);
    const assignedMilestones = milestones.filter(milestone => milestone.scope.kind === "streams" && milestone.scope.streamIds.includes(stream.id));
    const taskDates = assignedTasks.flatMap(task => [task.startDate, task.endDate].filter((date): date is string => Boolean(date)));
    const milestoneDates = assignedMilestones.map(milestone => milestone.plannedDate).filter(Boolean);
    return { id: stream.id, name: stream.name, ...dates([...taskDates, ...milestoneDates]),
      unscheduled: assignedTasks.filter(task => !task.startDate || !task.endDate).length + assignedMilestones.filter(milestone => !milestone.plannedDate).length };
  });
  const projectMilestones = milestones.filter(milestone => milestone.scope.kind === "project" || (milestone.scope.kind === "streams" && milestone.scope.streamIds.length === 0));
  const projectTasks = tasks.filter(task => task.scope.kind === "project");
  const projectDates = [...projectMilestones.map(milestone => milestone.plannedDate),
    ...projectTasks.flatMap(task => [task.startDate, task.endDate])].filter((date): date is string => Boolean(date));
  rows.push({ id: "project-wide", name: "Project-wide", ...dates(projectDates),
    unscheduled: projectMilestones.filter(milestone => !milestone.plannedDate).length + projectTasks.filter(task => !task.startDate || !task.endDate).length });
  const allDates = [...rows.flatMap(row => [row.start, row.end])].filter((date): date is string => Boolean(date));
  return { rows, ...dates(allDates), unscheduledTotal: tasks.filter(task => !task.startDate || !task.endDate).length +
    milestones.filter(milestone => !milestone.plannedDate).length };
}
