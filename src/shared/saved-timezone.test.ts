import { describe, expect, it } from "vitest";
import { formatSavedTime, savedTimeZoneLabel } from "./saved-timezone";

describe("saved-device timezone", () => {
  it("uses the offset recorded at save time, including during DST changes", () => {
    const instant = "2026-10-25T01:30:00.000Z";
    const summer = formatSavedTime(instant, { name: "Europe/Madrid", utcOffsetMinutes: 120 });
    const winter = formatSavedTime(instant, { name: "Europe/Madrid", utcOffsetMinutes: 60 });
    expect(summer).toContain("03:30");
    expect(winter).toContain("02:30");
  });
  it("supports negative and fractional-hour offsets", () => {
    expect(savedTimeZoneLabel({ name: "America/St_Johns", utcOffsetMinutes: -210 })).toBe("America/St_Johns (UTC-03:30)");
    expect(savedTimeZoneLabel({ name: "Asia/Kathmandu", utcOffsetMinutes: 345 })).toBe("Asia/Kathmandu (UTC+05:45)");
  });
  it("explains missing metadata in older project files", () => {
    expect(savedTimeZoneLabel()).toContain("Timezone unavailable");
  });
});
