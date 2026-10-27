'use client';

import { useState } from 'react';
import { createProjectStore } from '../../../src/application';
import { captureSchedule } from '../../../src/domain/baselines';
import { ACTIVE_DELETION_STATE } from '../../../src/domain/types';
import { makeProjectState, streamFixture, taskFixture } from '../../../src/domain/test-fixtures';
import { BaselineProvider } from '../../../src/features/baselines/selection';
import { GanttWorkspace } from '../../../src/features/gantt/workspace';
import { TubeMapView } from '../../../src/features/tube-map/tube-map';
import type { ModuleName } from '../../../src/features/shell/shell';

/** Fixed schedule data; the production charts deliberately retain their real clock. */
function createTimelineStore() {
  const identity = { projectId: 'project-1', deletion: ACTIVE_DELETION_STATE };
  const historical = makeProjectState({
    streams: [
      streamFixture({ name: 'Delivery' }),
      streamFixture({ id: 'stream-2', humanId: 'STREAM-002', name: 'Operations' }),
      streamFixture({ id: 'stream-3', humanId: 'STREAM-003', name: 'Empty stream' }),
    ],
    people: [{ ...identity, id: 'person-1', humanId: 'PERSON-001', name: 'Marta', role: 'Delivery lead' }],
    tasks: [
      taskFixture({ name: 'Prepare launch', ownerId: 'person-1', startDate: '2026-10-26', endDate: '2026-10-27', progress: 40 }),
      taskFixture({ id: 'task-2', humanId: 'TASK-002', name: 'Review launch', status: 'Not Started', startDate: '2026-10-29', endDate: '2026-10-30' }),
      taskFixture({ id: 'task-3', humanId: 'TASK-003', name: 'Prepare support', scope: { kind: 'stream', streamId: 'stream-2' }, status: 'On Hold', startDate: '2026-10-30', endDate: '2026-11-02' }),
      taskFixture({ id: 'task-4', humanId: 'TASK-004', name: 'Unscheduled follow-up', scope: { kind: 'project' }, status: 'Tentative' }),
    ],
    milestones: [
      { ...identity, id: 'milestone-1', humanId: 'MILESTONE-001', name: 'Launch approval', plannedDate: '2026-10-29', status: 'Planned', ownerId: 'person-1', scope: { kind: 'streams', streamIds: ['stream-1'] }, relatedTaskIds: ['task-1'] },
      { ...identity, id: 'milestone-2', humanId: 'MILESTONE-002', name: 'Support ready', plannedDate: '2026-11-02', status: 'Delayed', ownerId: null, scope: { kind: 'streams', streamIds: ['stream-2'] }, relatedTaskIds: ['task-3'] },
      { ...identity, id: 'milestone-3', humanId: 'MILESTONE-003', name: 'Project review', plannedDate: '2026-11-04', status: 'Tentative', ownerId: null, scope: { kind: 'project' }, relatedTaskIds: [] },
    ],
    dependencies: [
      { id: 'dependency-1', projectId: 'project-1', predecessor: { kind: 'task', id: 'task-1' }, successor: { kind: 'task', id: 'task-2' }, type: 'Finish-to-Start' },
      { id: 'dependency-2', projectId: 'project-1', predecessor: { kind: 'task', id: 'task-2' }, successor: { kind: 'task', id: 'task-3' }, type: 'Finish-to-Start' },
      { id: 'dependency-3', projectId: 'project-1', predecessor: { kind: 'milestone', id: 'milestone-1' }, successor: { kind: 'milestone', id: 'milestone-2' }, type: 'Finish-to-Start' },
      { id: 'dependency-4', projectId: 'project-1', predecessor: { kind: 'milestone', id: 'milestone-2' }, successor: { kind: 'milestone', id: 'milestone-3' }, type: 'Finish-to-Start' },
    ],
    identifierSequences: { stream: 3, person: 1, task: 4, milestone: 3, risk: 0, decision: 0 },
  });
  let sequence = 0;
  return createProjectStore({
    ...historical,
    tasks: historical.tasks.map(task => task.id === 'task-1' ? { ...task, endDate: '2026-10-28' } : task),
    milestones: historical.milestones.map(milestone => milestone.id === 'milestone-2' ? { ...milestone, plannedDate: '2026-11-03' } : milestone),
    baselines: [{ id: 'timeline-baseline-1', name: 'Initial schedule', createdAt: '2026-10-26T12:00:00Z', snapshot: captureSchedule(historical) }],
  }, { createId: () => `catalogue-timeline-${++sequence}`, now: () => '2026-10-27T12:00:00Z' });
}

export function TimelineExamples() {
  const [chart, setChart] = useState<'gantt' | 'tube-map'>('gantt');
  const [instance, setInstance] = useState(() => ({ store: createTimelineStore(), revision: 0 }));
  const [navigation, setNavigation] = useState('No navigation requested.');
  const navigate = (module: ModuleName, entityId?: string) => setNavigation(`Example navigation requested: ${module}${entityId ? ` · ${entityId}` : ''}. No application route was opened.`);
  return <section id="timelines" className="catalogue-section" aria-label="Timeline page examples">
    <h2>Timeline page examples</h2>
    <p>Actual Gantt workspace and Tube Map use disposable shared schedule data, real chart models, dependency focus, filters, quick editors and footers. The fixed schedule covers 26 October–4 November 2026; charts retain the browser’s current date because their production props do not expose a clock override. Navigation requests appear below instead of opening another application page.</p>
    <div className="catalogue-row" role="group" aria-label="Choose timeline page example">
      <button type="button" className="secondary" aria-pressed={chart === 'gantt'} onClick={() => setChart('gantt')}>Gantt chart</button>
      <button type="button" className="secondary" aria-pressed={chart === 'tube-map'} onClick={() => setChart('tube-map')}>Tube Map chart</button>
      <button type="button" className="secondary" onClick={() => { setInstance(previous => ({ store: createTimelineStore(), revision: previous.revision + 1 })); setNavigation('Timeline examples reset.'); }}>Reset timeline examples</button>
    </div>
    <p role="status" aria-live="polite">{navigation}</p>
    <div key={instance.revision} className={`workspace module-${chart} catalogue-timeline-workspace`} data-testid="timeline-example-content" style={{ height: 720, minHeight: 0, minWidth: 0, overflow: 'auto', position: 'relative' }}>
      <BaselineProvider store={instance.store}>
        {chart === 'gantt' ? <GanttWorkspace store={instance.store} navigate={navigate} /> : <TubeMapView store={instance.store} navigate={navigate} />}
      </BaselineProvider>
    </div>
  </section>;
}
