'use client';

import { useState } from 'react';
import { createProjectStore } from '../../../src/application';
import { makeProjectState, streamFixture, taskFixture } from '../../../src/domain/test-fixtures';
import { EntityCreationPanel } from '../../../src/features/shared/entity-creation-panel';
import { creationNames, type CreationKind } from '../../../src/features/shared/entity-creation';
import { useProjectState } from '../../../src/features/shell/use-project-state';

const kinds: readonly CreationKind[] = ['person', 'stream', 'task', 'milestone', 'risk', 'decision'];

/** A new store on every reset; no runtime, file service or persistence subscription. */
function makeCreationStore() {
  let sequence = 0;
  const projectId = 'project-1';
  return createProjectStore(makeProjectState({
    identifierSequences:{stream:1,person:1,task:1,milestone:1,risk:1,decision:1},
    people: [{ id: 'creation-owner', projectId, humanId: 'PERSON-001', name: 'Marta', role: 'Example owner', deletion: { isDeleted: false } }],
    streams: [streamFixture({ name: 'Hardware', ownerId: 'creation-owner' })],
    tasks: [taskFixture({ name: 'Prepare example equipment', ownerId: 'creation-owner', startDate: '2026-10-27', endDate: '2026-10-30' })],
    milestones: [{ id: 'creation-milestone', projectId, humanId: 'MILESTONE-001', name: 'Example handover', plannedDate: '2026-11-02', status: 'Planned', ownerId: 'creation-owner', scope: { kind: 'streams', streamIds: ['stream-1'] }, relatedTaskIds: ['task-1'], deletion: { isDeleted: false } }],
    risks: [{ id: 'creation-risk', projectId, humanId: 'RISK-001', title: 'Example delivery risk', status: 'Open', probability: 'Low', impact: 'Medium', riskLevel: 'Low', ownerId: 'creation-owner', projectWide: false, relatedStreamIds: ['stream-1'], relatedTaskIds: ['task-1'], relatedMilestoneIds: ['creation-milestone'], actions: [], deletion: { isDeleted: false } }],
    decisions: [{ id: 'creation-decision', projectId, humanId: 'DECISION-001', title: 'Example equipment decision', decisionDate: '2026-10-27', ownerId: 'creation-owner', projectWide: false, relatedStreamIds: ['stream-1'], relatedTaskIds: ['task-1'], relatedMilestoneIds: ['creation-milestone'], relatedRiskIds: ['creation-risk'], deletion: { isDeleted: false } }],
  }), { createId: () => `catalogue-creation-${++sequence}`, now: () => '2026-10-27T12:00:00Z' });
}

/** Real record creation, validation and dismissal against disposable catalogue data. */
export function CreationExamples() {
  const [store, setStore] = useState(makeCreationStore);
  const state = useProjectState(store);
  const [kind, setKind] = useState<CreationKind | null>(null);
  const [notice, setNotice] = useState('No example records created.');
  const counts: Record<CreationKind, number> = {
    person: state.people.length,
    stream: state.streams.length,
    task: state.tasks.length,
    milestone: state.milestones.length,
    risk: state.risks.length,
    decision: state.decisions.length,
  };
  const reset = () => {
    setStore(makeCreationStore());
    setNotice('Examples reset. All created records and history discarded.');
  };

  return <section id="creation" className="catalogue-section" aria-label="Creation examples">
    <h2>All record creation panels</h2>
    <p className="catalogue-note">Six actual creation panels share disposable example data. Each starts with a blank draft and real validation. Create empty to inspect errors and first-invalid focus. Change a value, then press Escape or click outside to inspect Stay/Discard; Cancel discards immediately. Refresh or Reset examples discards all local records and history.</p>
    <div className="catalogue-row">
      {kinds.map(value => <button key={value} type="button" onClick={() => setKind(value)}>Create example {creationNames[value]}</button>)}
      <button type="button" className="secondary" disabled={kind !== null} onClick={reset}>Reset creation examples</button>
    </div>
    <p role="status" aria-live="polite">{notice} {kinds.map(value => `${creationNames[value]}: ${counts[value]} (${counts[value] - 1} created)`).join(' · ')}</p>
    <p className="catalogue-note">One fixture of each kind supplies owners, scopes, parent tasks, milestones, predecessors and context relationships. Newly created records become available in subsequent panels. No project files are opened or written.</p>
    {kind && <EntityCreationPanel key={kind} kind={kind} store={store} onClose={() => setKind(null)} onCreated={() => setNotice(`${creationNames[kind]} created in disposable memory.`)}/>}
  </section>;
}
