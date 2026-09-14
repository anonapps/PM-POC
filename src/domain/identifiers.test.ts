import { describe, expect, it } from "vitest";

import {
  EMPTY_IDENTIFIER_SEQUENCES,
  issueHumanId,
  sequencesFromHumanIds,
} from "./identifiers";

describe("human-readable identifier sequencing", () => {
  it("maintains an independent sequence for each entity kind", () => {
    const stream = issueHumanId(EMPTY_IDENTIFIER_SEQUENCES, "stream");
    const task = issueHumanId(stream.sequences, "task");
    expect(stream.humanId).toBe("STREAM-001");
    expect(task.humanId).toBe("TASK-001");
  });

  it("continues from the highest issued value rather than filling gaps", () => {
    const sequences = sequencesFromHumanIds([
      "TASK-001",
      "TASK-003",
      "TASK-008",
    ]);
    expect(issueHumanId(sequences, "task").humanId).toBe("TASK-009");
  });

  it("does not mutate the previous sequence state", () => {
    const issued = issueHumanId(EMPTY_IDENTIFIER_SEQUENCES, "risk");
    expect(EMPTY_IDENTIFIER_SEQUENCES.risk).toBe(0);
    expect(issued.sequences.risk).toBe(1);
  });
});
