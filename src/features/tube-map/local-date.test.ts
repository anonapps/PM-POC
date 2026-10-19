import { describe, expect, it } from "vitest";
import { inclusiveTubeMapEnd, tubeMapAnchorDate, tubeMapDisplayDate } from "./local-date";

describe("Tube Map local calendar anchor", () => {
  it("preserves the local calendar day rather than using the UTC date", () => {
    const instant = new Date("2026-12-31T23:30:00Z");
    const localDate = new Date(2027, 0, 1, 0, 30);
    expect(tubeMapAnchorDate(localDate, 0)).toBe("2027-01-01");
    expect(tubeMapAnchorDate(instant, 0)).toBe(`${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, "0")}-${String(instant.getDate()).padStart(2, "0")}`);
  });

  it("moves exactly twelve weeks in either direction across a year boundary", () => {
    const localDate = new Date(2026, 11, 31, 12);
    expect(tubeMapAnchorDate(localDate, 1)).toBe("2027-03-25");
    expect(tubeMapAnchorDate(localDate, -1)).toBe("2026-10-08");
    expect(tubeMapAnchorDate(localDate, 0)).toBe("2026-12-31");
  });
});

describe("Tube Map visible date range", () => {
  it("shows the last Sunday instead of the exclusive next Monday", () => {
    expect(inclusiveTubeMapEnd("2026-12-07")).toBe("2026-12-06");
    expect(inclusiveTubeMapEnd("2027-01-04")).toBe("2027-01-03");
  });
});

describe("Tube Map date display", () => {
  it("formats range dates in day/month/year order without timezone shifts", () => {
    expect(tubeMapDisplayDate("2026-09-14")).toBe("14/09/2026");
    expect(tubeMapDisplayDate(inclusiveTubeMapEnd("2027-01-04"))).toBe("03/01/2027");
  });
});
