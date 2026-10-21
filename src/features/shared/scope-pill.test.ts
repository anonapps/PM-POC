import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { ScopePill, scopeColourIndex } from "./scope-pill";

describe("scope pills", () => {
  it("uses stable colours for identical names regardless of case", () => {
    expect(scopeColourIndex("Delivery")).toBe(scopeColourIndex("delivery"));
    expect(scopeColourIndex(" Delivery ")).toBe(scopeColourIndex("delivery"));
  });
  it("renders both accessible full and abbreviated project-wide labels", () => {
    const html=renderToStaticMarkup(createElement(ScopePill,{name:"Project-wide"}));
    expect(html).toContain("Project-wide");
    expect(html).toContain("ALL");
    expect(html).toContain("aria-label=\"Project-wide\"");
  });
});
