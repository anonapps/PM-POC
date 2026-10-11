import { makeProjectState } from '../domain/test-fixtures';
import { LIFECYCLE_STATUSES, PRIORITIES, type HumanId } from '../domain/types';
import { MILESTONE_STATUSES, RISK_STATUSES, RISK_RATINGS } from '../domain/entities';
import { calculateRiskLevel } from '../domain/risk';
import { recalculate } from '../application/commands';
import type { ProjectState } from '../application/state';

export const REGRESSION_TODAY = '2026-10-11';
export function regressionFixture(): ProjectState {
  const indexes = Array.from({ length: 30 }, (_, i) => i);
  const id = (kind: string, i: number) => `${kind}-${i + 1}`;
  const identity = (kind: string, i: number) => ({ id: id(kind, i), projectId: 'project-1', humanId: `${kind.toUpperCase()}-${String(i + 1).padStart(3, '0')}` as HumanId, deletion: { isDeleted: false } });
  const name = (kind: string, i: number) => i % 10 === 0 ? `Regression ${kind} — ${'long name '.repeat(12)} <>& ñ` : i % 10 === 1 ? `Regression ${kind} duplicate` : `Regression ${kind} ${i + 1}`;
  const owner = (i: number) => Math.floor(i / 5) % 2 === 0 ? null : id('person', i % 3);
  const dates = ['2025-12-31', '2026-10-11', '2026-11-15', '2027-01-01', '2026-12-31'];
  const links = (i: number) => ({ projectWide: i % 3 === 0, relatedStreamIds: i % 3 === 0 ? [] : [id('stream', i), id('stream', (i + 1) % 30)], relatedTaskIds: i % 2 ? [id('task', i)] : [], relatedMilestoneIds: i % 2 ? [id('milestone', i)] : [] });
  return recalculate(makeProjectState({
    project: { ...makeProjectState().project, name: 'Regression 180 records', startDate: '2026-10-01', endDate: '2026-12-31', metadata: { schemaVersion: 2, minimumAppVersion: '1.2.0', gettingStartedCompleted: true } },
    people: indexes.map(i => ({ ...identity('person', i), name: name('person', i) })),
    streams: indexes.map(i => ({ ...identity('stream', i), name: name('stream', i), status: LIFECYCLE_STATUSES[i % 5], ownerId: owner(i), priority: PRIORITIES[i % 3], startDate: i % 4 ? dates[i % 5] : null, endDate: i % 4 ? '2027-02-01' : null })),
    tasks: indexes.map(i => ({ ...identity('task', i), name: name('task', i), status: LIFECYCLE_STATUSES[i % 5], ownerId: owner(i), priority: PRIORITIES[i % 3], progress: [0,25,50,75,100][Math.floor(i / 5) % 5], scope: i < 4 || i % 3 === 0 ? { kind: 'project' as const } : { kind: 'stream' as const, streamId: id('stream', i) }, parentTaskId: i > 0 && i < 4 ? id('task', i - 1) : undefined, startDate: i % 4 ? dates[i % 5] : null, endDate: i % 4 ? '2027-02-01' : null })),
    milestones: indexes.map(i => ({ ...identity('milestone', i), name: name('milestone', i), status: MILESTONE_STATUSES[i % 4], ownerId: Math.floor(i / 4) % 2 ? id('person', i % 3) : null, plannedDate: dates[i % 5], scope: i % 3 === 0 ? { kind: 'project' as const } : { kind: 'streams' as const, streamIds: [id('stream', i), id('stream', (i + 1) % 30)] }, relatedTaskIds: i % 2 ? [id('task', i)] : [] })),
    risks: indexes.map(i => ({ ...identity('risk', i), title: name('risk', i), description: i % 2 ? 'Detailed mitigation context <>& ñ' : undefined, status: RISK_STATUSES[i % 4], probability: RISK_RATINGS[i % 3], impact: RISK_RATINGS[Math.floor(i / 3) % 3], riskLevel: calculateRiskLevel(RISK_RATINGS[i % 3], RISK_RATINGS[Math.floor(i / 3) % 3]), ownerId: Math.floor(i / 4) % 2 ? id('person', i % 3) : null, dueDate: i % 4 ? dates[i % 5] : undefined, ...links(i), actions: i % 3 === 0 ? [] : [{ id: `action-${i}-open`, description: 'Overdue mitigation', status: 'Open' as const, dueDate: '2026-10-01' }, { id: `action-${i}-complete`, description: 'Completed mitigation', status: 'Complete' as const, dueDate: '2026-10-01' }] })),
    decisions: indexes.map(i => ({ ...identity('decision', i), title: name('decision', i), description: i % 2 ? 'Rationale with <>& ñ' : undefined, decisionDate: dates[i % 5], ownerId: owner(i), ...links(i), relatedRiskIds: i % 3 ? [id('risk', i), id('risk', (i + 1) % 30)] : [] })),
    dependencies: [...indexes.filter(i => i > 4 && i % 3 !== 0).flatMap(i => ['task', 'milestone'].map(kind => ({ id: `dependency-${kind}-${i}`, projectId: 'project-1', type: 'Finish-to-Start' as const, predecessor: { kind: kind as 'task' | 'milestone', id: id(kind, i - 1) }, successor: { kind: kind as 'task' | 'milestone', id: id(kind, i) } }))), { id: 'multiple-task-predecessor', projectId: 'project-1', type: 'Finish-to-Start', predecessor: { kind: 'task', id: 'task-5' }, successor: { kind: 'task', id: 'task-9' } }, { id: 'task-to-milestone', projectId: 'project-1', type: 'Finish-to-Start', predecessor: { kind: 'task', id: 'task-30' }, successor: { kind: 'milestone', id: 'milestone-30' } }],
    identifierSequences: { stream: 30, task: 30, milestone: 30, person: 30, risk: 30, decision: 30 },
  }));
}
