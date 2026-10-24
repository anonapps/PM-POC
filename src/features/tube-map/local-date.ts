/** Translate a local calendar day into a UTC-safe ISO date for the timeline model. */
export function tubeMapAnchorDate(now: Date, windowOffset: number): string {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + windowOffset * 28)).toISOString().slice(0, 10);
}

/** Show the inclusive final day for a timeline whose end boundary is exclusive. */
export function inclusiveTubeMapEnd(exclusiveEnd: string): string {
  const end = new Date(`${exclusiveEnd}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}

export { timelineDisplayDate as tubeMapDisplayDate } from "../shared/timeline-date";
