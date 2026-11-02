import { validScheduleDate } from "../baselines";

export const dayNumber = (value: unknown): number | null => validScheduleDate(value) ? Date.parse(`${value}T00:00:00Z`) / 86400000 : null;
export const calendarDate = (day: number): string => new Date(day * 86400000).toISOString().slice(0, 10);

/** Shared eligibility for calculations and presentation; invalid dates stay correctable. */
export function taskScheduleDuration(task: {startDate?: string | null; endDate?: string | null}): number | null {
  const start = dayNumber(task.startDate), finish = dayNumber(task.endDate);
  return start !== null && finish !== null && finish >= start ? finish - start + 1 : null;
}
