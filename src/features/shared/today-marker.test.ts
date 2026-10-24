import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TodayMarker } from "./today-marker";
import { ModuleSearch } from "./module-search";

describe("shared timeline marker", () => {
  it("renders a body marker with the chart's percentage position and date label", () => {
    const markup = renderToStaticMarkup(createElement(TodayMarker, { left: "25%", label: "Today 24/10/2026" }));
    expect(markup).toContain('class="timeline-today-marker"');
    expect(markup).toContain('left:25%');
    expect(markup).toContain('aria-label="Today 24/10/2026"');
  });
});

describe("creation toolbar", () => {
  it("keeps a disabled Search trigger visible without exposing search controls", () => {
    const markup = renderToStaticMarkup(createElement(ModuleSearch, { title: "people", value: "existing query", onChange() {}, placeholder: "Search people", disabled: true }));
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('Search and filter people');
    expect(markup).not.toContain('type="search"');
  });
});
