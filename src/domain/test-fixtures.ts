import type { Project, Stream, Task } from "./entities";
import { ACTIVE_DELETION_STATE } from "./types";

export const projectFixture = (overrides: Partial<Project> = {}): Project => ({
  id: "project-1",
  name: "Project",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  status: "In Progress",
  progress: 25,
  metadata: { schemaVersion: 1, minimumAppVersion: "0.1.0" },
  ...overrides,
});

export const streamFixture = (overrides: Partial<Stream> = {}): Stream => ({
  id: "stream-1",
  projectId: "project-1",
  humanId: "STREAM-001",
  name: "Stream",
  ownerId: null,
  status: "In Progress",
  deletion: ACTIVE_DELETION_STATE,
  ...overrides,
});

export const taskFixture = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  projectId: "project-1",
  humanId: "TASK-001",
  name: "Task",
  scope: { kind: "stream", streamId: "stream-1" },
  status: "In Progress",
  ownerId: null,
  progress: 0,
  deletion: ACTIVE_DELETION_STATE,
  ...overrides,
});
