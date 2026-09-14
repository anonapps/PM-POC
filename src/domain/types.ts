/** Date-only value in ISO 8601 `YYYY-MM-DD` form. */
export type LocalDate = string;

/** Opaque, stable identity generated outside the domain model. */
export type InternalId = string;

export type ProjectId = InternalId;
export type PersonId = InternalId;
export type StreamId = InternalId;
export type TaskId = InternalId;
export type MilestoneId = InternalId;
export type RiskId = InternalId;

export type EntityKind =
  | "project"
  | "stream"
  | "task"
  | "milestone"
  | "person"
  | "risk"
  | "decision";

export type SequencedEntityKind = Exclude<EntityKind, "project">;

export type HumanIdPrefix =
  | "STREAM"
  | "TASK"
  | "MILESTONE"
  | "PERSON"
  | "RISK"
  | "DECISION";

export type HumanId = `${HumanIdPrefix}-${string}`;

export const LIFECYCLE_STATUSES = [
  "Not Started",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
] as const;
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export const PRIORITIES = ["Low", "Medium", "High"] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface EntityIdentity {
  readonly id: InternalId;
  readonly projectId: ProjectId;
  readonly humanId: HumanId;
}

export interface DeletionState {
  readonly isDeleted: boolean;
  readonly deletedAt?: string;
}

export interface SoftDeletable {
  readonly deletion: DeletionState;
}

export const ACTIVE_DELETION_STATE: DeletionState = Object.freeze({
  isDeleted: false,
});

export type OwnerId = PersonId | null;

/** Exactly one stream or an explicit project-wide scope. */
export type TaskScope =
  | { readonly kind: "stream"; readonly streamId: StreamId }
  | { readonly kind: "project" };

/** Zero or more streams, unless explicitly project-wide. */
export type MilestoneScope =
  | { readonly kind: "streams"; readonly streamIds: readonly StreamId[] }
  | { readonly kind: "project" };

export interface ProjectDomainMetadata {
  readonly schemaVersion: number;
  readonly minimumAppVersion: string;
}
