/** Format an ISO calendar date without converting it to the viewer's timezone. */
export function timelineDisplayDate(isoDate:string):string {
  const [year,month,day]=isoDate.split("-");
  return `${day}/${month}/${year}`;
}

const DAY_MS = 86_400_000;
// Both charts fit twelve columns to the date viewport, after the fixed labels.
const REFERENCE_COLUMN = 4;

export function shiftTimelineDate(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function timelineDateAtReference(start: string, columnDays: number): string {
  return shiftTimelineDate(start, REFERENCE_COLUMN * columnDays);
}

export function timelineStartAtReference(date: string, columnDays: number): string {
  return shiftTimelineDate(date, -REFERENCE_COLUMN * columnDays);
}
