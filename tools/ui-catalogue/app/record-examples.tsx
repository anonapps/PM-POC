'use client';

import { useState } from 'react';
import { createProjectStore } from '../../../src/application';
import { captureSchedule } from '../../../src/domain/baselines';
import { makeProjectState, streamFixture, taskFixture } from '../../../src/domain/test-fixtures';
import { ACTIVE_DELETION_STATE } from '../../../src/domain/types';
import { DependenciesModule } from '../../../src/features/dependencies/dependencies';
import { PeopleModule, StreamsModule } from '../../../src/features/resources/resources';
import { TasksModule } from '../../../src/features/tasks/tasks';
import { RiskLog } from '../../../src/features/risks/risks';
import { DecisionLog } from '../../../src/features/decisions/decisions';
import { BaselinesModule } from '../../../src/features/baselines/baselines';
import { BaselineProvider } from '../../../src/features/baselines/selection';

const modules = ['Tasks', 'People', 'Streams', 'Risk Log', 'Decision Log', 'Baselines', 'Dependencies'] as const;
type RecordModule = typeof modules[number];

/** Rebuilt on reset; no runtime, file service or project handle is constructed. */
function createRecordStore() {
  const identity = { projectId: 'project-1', deletion: ACTIVE_DELETION_STATE };
  const historical = makeProjectState({
    streams: [streamFixture({ name: 'Delivery' }), streamFixture({ id: 'stream-2', humanId: 'STREAM-002', name: 'Operations' })],
    people: [
      { ...identity, id: 'person-1', humanId: 'PERSON-001', name: 'Marta', role: 'Delivery lead' },
      { ...identity, id: 'person-2', humanId: 'PERSON-002', name: 'Previous owner', deletion: { isDeleted: true, deletedAt: '2026-10-20T12:00:00Z' } },
    ],
    tasks: [
      taskFixture({ name: 'Prepare launch', startDate: '2026-10-26', endDate: '2026-10-30', ownerId: 'person-1', progress: 25 }),
      taskFixture({ id: 'task-2', humanId: 'TASK-002', name: 'Review accessibility and a deliberately long task name for full-value inspection', scope: { kind: 'project' }, status: 'Not Started', startDate: '2026-11-02', endDate: '2026-11-05', ownerId: 'person-2' }),
      taskFixture({ id: 'task-3', humanId: 'TASK-003', name: 'Previous schedule item', startDate: '2026-10-20', endDate: '2026-10-23' }),
    ],
    milestones: [{ ...identity, id: 'milestone-1', humanId: 'MILESTONE-001', name: 'Launch approval', plannedDate: '2026-11-06', status: 'Planned', ownerId: 'person-1', scope: { kind: 'streams', streamIds: ['stream-1'] }, relatedTaskIds: ['task-1'] }],
    risks: [
      { ...identity, id: 'risk-1', humanId: 'RISK-001', title: 'Delivery capacity', description: 'Review availability before launch.', status: 'Open', probability: 'High', impact: 'Medium', riskLevel: 'High', ownerId: 'person-1', projectWide: false, relatedStreamIds: ['stream-1'], relatedTaskIds: ['task-1'], relatedMilestoneIds: ['milestone-1'], actions: [{ id: 'action-1', description: 'Confirm cover for launch', status: 'Open' }, { id: 'action-2', description: 'Review contingency plan', status: 'Complete' }] },
      { ...identity, id: 'risk-2', humanId: 'RISK-002', title: 'Archived risk', status: 'Closed', probability: 'Low', impact: 'Low', riskLevel: 'Low', ownerId: null, projectWide: true, relatedStreamIds: [], relatedTaskIds: [], relatedMilestoneIds: [], actions: [], deletion: { isDeleted: true, deletedAt: '2026-10-20T12:00:00Z' } },
    ],
    decisions: [
      { ...identity, id: 'decision-1', humanId: 'DECISION-001', title: 'Approve launch approach', description: 'Record the agreed approach and linked delivery context.', decisionDate: '2026-10-27', ownerId: 'person-1', projectWide: false, relatedStreamIds: ['stream-1'], relatedTaskIds: ['task-1'], relatedMilestoneIds: ['milestone-1'], relatedRiskIds: ['risk-1'] },
      { ...identity, id: 'decision-2', humanId: 'DECISION-002', title: 'Project communication cadence', decisionDate: '2026-10-26', ownerId: null, projectWide: true, relatedStreamIds: [], relatedTaskIds: [], relatedMilestoneIds: [], relatedRiskIds: [] },
    ],
    identifierSequences:{stream:2,person:2,task:4,milestone:1,risk:2,decision:2},
    dependencies: [{ id: 'dependency-1', projectId: 'project-1', predecessor: { kind: 'task', id: 'task-1' }, successor: { kind: 'task', id: 'task-2' }, type: 'Finish-to-Start' }],
  });
  const current = {
    ...historical,
    tasks: historical.tasks.map(task => task.id === 'task-1' ? { ...task, startDate: '2026-10-28', endDate: '2026-11-02' } : task.id === 'task-3' ? { ...task, deletion: { isDeleted: true, deletedAt: '2026-10-25T12:00:00Z' } } : task).concat(taskFixture({ id: 'task-4', humanId: 'TASK-004', name: 'New follow-up', scope: { kind: 'stream', streamId: 'stream-2' }, status: 'Tentative' })),
  };
  let sequence = 0;
  return createProjectStore({
    ...current,
    baselines: [
      { id: 'baseline-1', name: 'Initial plan', description: 'Matched, added and removed schedule examples.', createdAt: '2026-10-26T12:00:00Z', snapshot: captureSchedule(historical) },
      { id: 'baseline-2', name: 'Current plan', createdAt: '2026-10-27T12:00:00Z', snapshot: captureSchedule(current) },
    ],
  }, { createId: () => `catalogue-record-${++sequence}`, now: () => '2026-10-27T12:00:00Z' });
}

export function RecordExamples() {
  const [module, setModule] = useState<RecordModule>('Tasks');
  const [instance, setInstance] = useState(() => ({ store: createRecordStore(), revision: 0 }));
  return <section id="records" className="catalogue-section" aria-label="Record page examples">
    <h2>Record page examples</h2>
    <p>Real page modules share disposable fixture data. Edits, selection, sorting, context editors and baseline menus use their existing behavior. Reset restores records and closes module-local UI; Risk Matrix disclosure keeps its normal session preference on this catalogue origin.</p>
    <div className="catalogue-row" role="group" aria-label="Choose record page example">
      {modules.map(name => <button key={name} type="button" className="secondary" aria-pressed={module === name} onClick={() => setModule(name)}>{name}</button>)}
      <button type="button" className="secondary" onClick={() => setInstance(previous => ({ store: createRecordStore(), revision: previous.revision + 1 }))}>Reset record examples</button>
    </div>
    <div key={instance.revision} className={`workspace module-${module.toLowerCase().replaceAll(" ", "-")}`} data-testid="record-example-content">
      <BaselineProvider store={instance.store}>
        {module === 'People' && <PeopleModule store={instance.store} />}
        {module === 'Streams' && <StreamsModule store={instance.store} />}
        {module === 'Tasks' && <TasksModule store={instance.store} />}
        {module === 'Risk Log' && <RiskLog store={instance.store} />}
        {module === 'Decision Log' && <DecisionLog store={instance.store} />}
        {module === 'Baselines' && <BaselinesModule store={instance.store} />}
        {module === 'Dependencies' && <DependenciesModule store={instance.store} />}
      </BaselineProvider>
    </div>
  </section>;
}
