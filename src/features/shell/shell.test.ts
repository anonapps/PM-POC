import { describe, expect, it } from "vitest";
import { keyboardAction, MODULES, saveStateLabel } from "./shell";
describe("application shell", () => {
  it("provides all planned navigation with active-ready Overview", () => expect(MODULES).toContain("Overview"));
  it("renders every real save state", () => expect(["saved", "dirty", "saving", "failed", "lost"].map((s) => saveStateLabel(s as never))).toEqual(["Saved", "Unsaved", "Saving…", "Save failed", "File access lost"]));
  it("routes safe keyboard commands", () => { expect(keyboardAction({ key: "s", ctrlKey: true, metaKey: false, shiftKey: false })).toBe("save"); expect(keyboardAction({ key: "z", ctrlKey: false, metaKey: true, shiftKey: true })).toBe("redo"); expect(keyboardAction({ key: "k", ctrlKey: true, metaKey: false, shiftKey: false })).toBe("search"); });
});
