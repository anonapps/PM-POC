import { describe, expect, it } from "vitest";
import { matchesOption } from "./searchable-option-list";

describe("matchesOption", () => {
  it("matches names case-insensitively across separate words", () => {
    expect(matchesOption({name:"Release Planning",id:"TASK-014"},"planning release")).toBe(true);
  });
  it("matches an ID even when a name is present", () => {
    expect(matchesOption({name:"Design Review",id:"TASK-014"},"task-014")).toBe(true);
  });
  it("supports mixed ID and name terms", () => {
    expect(matchesOption({name:"Design Review",id:"TASK-014"},"design 014")).toBe(true);
  });
  it("matches label-only options", () => {
    expect(matchesOption({label:"Project-wide"},"PROJECT")).toBe(true);
  });
  it("matches string options", () => {
    expect(matchesOption("In Progress","progress")).toBe(true);
  });
  it("does not match unrelated terms", () => {
    expect(matchesOption({name:"Design Review",id:"TASK-014"},"design risk")).toBe(false);
  });
  it("treats blank search as all options", () => {
    expect(matchesOption({name:"Any option"},"   ")).toBe(true);
  });
});
