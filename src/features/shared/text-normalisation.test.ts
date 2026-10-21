import { describe, expect, it } from "vitest";
import { capitaliseFirstLetter } from "./text-normalisation";

describe("capitaliseFirstLetter", () => {
  it("capitalises only the first letter, preserving remaining case", () => {
    expect(capitaliseFirstLetter("hello WORLD")).toBe("Hello WORLD");
    expect(capitaliseFirstLetter("HELLO WORLD")).toBe("HELLO WORLD");
  });
  it("preserves whitespace and leading punctuation", () => {
    expect(capitaliseFirstLetter("  (hello world)")).toBe("  (Hello world)");
  });
  it("does not change text that is already capitalised", () => {
    expect(capitaliseFirstLetter("Project-wide")).toBe("Project-wide");
    expect(capitaliseFirstLetter("NASA")).toBe("NASA");
  });
  it("handles Unicode and empty text", () => {
    expect(capitaliseFirstLetter("équipe")).toBe("Équipe");
    expect(capitaliseFirstLetter("")).toBe("");
    expect(capitaliseFirstLetter("123 -")).toBe("123 -");
  });
});
