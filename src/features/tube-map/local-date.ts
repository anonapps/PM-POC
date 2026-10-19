/** Translate a local calendar day into a UTC-safe ISO date for the timeline model. */
export function tubeMapAnchorDate(now: Date, windowOffset: number): string {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + windowOffset * 84)).toISOString().slice(0, 10);
}
