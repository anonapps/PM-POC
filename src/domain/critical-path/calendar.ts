import { validScheduleDate } from "../baselines";

export const dayNumber = (value: unknown): number | null => validScheduleDate(value) ? Date.parse(`${value}T00:00:00Z`) / 86400000 : null;
export const calendarDate = (day: number): string => new Date(day * 86400000).toISOString().slice(0, 10);
