import { describe, expect, it } from "vitest";

import { APP_DESCRIPTION, APP_NAME } from "./app-info";

describe("application information", () => {
  it("provides content for the foundation shell", () => {
    expect(APP_NAME).toBe("ARGOS PM");
    expect(APP_DESCRIPTION).toBeTruthy();
  });
});
