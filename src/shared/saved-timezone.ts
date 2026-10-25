/** The offset is captured on the saving device at the instant of the write.
 * Use that offset rather than today's daylight-saving rules when displaying old saves.
 */
export interface SavedTimeZone { readonly name: string; readonly utcOffsetMinutes: number }

export function captureSavedTimeZone(at: Date = new Date()): SavedTimeZone {
  return {
    name: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local",
    utcOffsetMinutes: -at.getTimezoneOffset(),
  };
}

export function formatSavedTime(timestamp: string, zone?: SavedTimeZone): string {
  if (!zone) return new Date(timestamp).toLocaleString();
  const shifted = new Date(new Date(timestamp).getTime() + zone.utcOffsetMinutes * 60_000);
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(shifted);
}

export function savedTimeZoneLabel(zone?: SavedTimeZone): string {
  if (!zone) return "Timezone unavailable (legacy file or not yet saved)";
  const offset = Math.abs(zone.utcOffsetMinutes);
  return `${zone.name} (UTC${zone.utcOffsetMinutes >= 0 ? "+" : "-"}${String(Math.floor(offset / 60)).padStart(2, "0")}:${String(offset % 60).padStart(2, "0")})`;
}
