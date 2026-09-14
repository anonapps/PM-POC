import type {
  EntityIdentity,
  HumanId,
  InternalId,
  LifecycleStatus,
  LocalDate,
  MilestoneId,
  MilestoneScope,
  OwnerId,
  Priority,
  ProjectDomainMetadata,
  ProjectId,
  RiskId,
  SoftDeletable,
  StreamId,
  TaskId,
  TaskScope,
} from "./types";

export interface Project {
  readonly id: ProjectId;
  readonly name: string;
  readonly description?: string;
  readonly startDate: LocalDate;
  readonly endDate?: LocalDate;
  readonly status: LifecycleStatus;
  readonly progress: number;
  readonly metadata: ProjectDomainMetadata;
}

export interface Stream extends EntityIdentity, SoftDeletable {
  readonly name: string;
  readonly description?: string;
  readonly ownerId: OwnerId;
  readonly status: LifecycleStatus;
  readonly startDate?: LocalDate;
  readonly endDate?: LocalDate;
  readonly priority?: Priority;
}

export interface Task extends EntityIdentity, SoftDeletable {
  readonly name: string;
  readonly description?: string;
  readonly scope: TaskScope;
  readonly status: LifecycleStatus;
  readonly startDate?: LocalDate;
  readonly endDate?: LocalDate;
  readonly ownerId: OwnerId;
  readonly priority?: Priority;
  readonly progress: number;
  readonly milestoneId?: MilestoneId;
  readonly parentTaskId?: TaskId;
  readonly actualCompletionDate?: LocalDate;
}

export const MILESTONE_STATUSES = [
  "Tentative",
  "Planned",
  "Delayed",
  "Complete",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export interface Milestone extends EntityIdentity, SoftDeletable {
  readonly name: string;
  readonly description?: string;
  readonly plannedDate: LocalDate;
  readonly status: MilestoneStatus;
  readonly ownerId: OwnerId;
  readonly priority?: Priority;
  readonly scope: MilestoneScope;
  readonly relatedTaskIds: readonly TaskId[];
  readonly actualCompletionDate?: LocalDate;
}

export interface Person extends EntityIdentity, SoftDeletable {
  readonly name: string;
}

export const RISK_STATUSES = ["Open", "Mitigated", "Closed", "Accepted"] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const RISK_RATINGS = ["Low", "Medium", "High"] as const;
export type RiskRating = (typeof RISK_RATINGS)[number];
export type RiskLevel = RiskRating;

export const RISK_ACTION_STATUSES = ["Open", "Complete"] as const;
export type RiskActionStatus = (typeof RISK_ACTION_STATUSES)[number];

export interface RiskAction {
  readonly id: InternalId;
  readonly description: string;
  readonly status: RiskActionStatus;
  readonly dueDate?: LocalDate;
}

export interface Risk extends EntityIdentity, SoftDeletable {
  readonly title: string;
  readonly description?: string;
  readonly status: RiskStatus;
  readonly probability: RiskRating;
  readonly impact: RiskRating;
  /** Derived with `calculateRiskLevel`; retained here as the calculated projection. */
  readonly riskLevel: RiskLevel;
  readonly ownerId: OwnerId;
  readonly dueDate?: LocalDate;
  readonly projectWide: boolean;
  readonly relatedStreamIds: readonly StreamId[];
  readonly relatedTaskIds: readonly TaskId[];
  readonly relatedMilestoneIds: readonly MilestoneId[];
  readonly actions: readonly RiskAction[];
}

export interface Decision extends EntityIdentity, SoftDeletable {
  readonly title: string;
  readonly description?: string;
  readonly decisionDate: LocalDate;
  readonly ownerId: OwnerId;
  readonly projectWide: boolean;
  readonly relatedStreamIds: readonly StreamId[];
  readonly relatedTaskIds: readonly TaskId[];
  readonly relatedMilestoneIds: readonly MilestoneId[];
  readonly relatedRiskIds: readonly RiskId[];
}

export interface ProjectEntities {
  readonly project: Project;
  readonly streams: readonly Stream[];
  readonly tasks: readonly Task[];
  readonly milestones: readonly Milestone[];
  readonly people: readonly Person[];
  readonly risks: readonly Risk[];
  readonly decisions: readonly Decision[];
}

/** Useful when validating fixtures before narrowing a human ID. */
export interface IdentifiedEntity {
  readonly id: InternalId;
  readonly humanId: HumanId;
}
