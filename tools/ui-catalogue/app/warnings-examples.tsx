'use client';

import { useState } from 'react';
import { createProjectStore } from '../../../src/application';
import { makeProjectState, taskFixture } from '../../../src/domain/test-fixtures';
import { WarningsPanel } from '../../../src/features/warnings/warnings-panel';

function createWarningsStore() {
  return createProjectStore(makeProjectState({
    tasks: [
      taskFixture({ id: 'deleted-predecessor', name: 'Previous task', scope: { kind: 'project' }, deletion: { isDeleted: true } }),
      taskFixture({ id: 'active-successor', humanId: 'TASK-002', name: 'Follow-up task', scope: { kind: 'project' } }),
    ],
    dependencies: [{ id: 'catalogue-deleted-dependency', projectId: 'project-1', predecessor: { kind: 'task', id: 'deleted-predecessor' }, successor: { kind: 'task', id: 'active-successor' }, type: 'Finish-to-Start' }],
    identifierSequences: { stream: 0, task: 2, milestone: 0, person: 0, risk: 0, decision: 0 },
  }), { createId: () => 'catalogue-warning-command', now: () => '2026-10-29T12:00:00Z' });
}

/** Actual warning correction, confined to a resettable in-memory fixture. */
export function WarningsExamples() {
  const [instance, setInstance] = useState(() => ({ store: createWarningsStore(), revision: 0 }));
  const [navigation, setNavigation] = useState('No warning navigation requested.');
  return <section id="warnings" className="catalogue-section" aria-label="Warnings page example">
    <h2>Warnings page example</h2>
    <p>The real warning panel uses disposable data with a deleted predecessor. Confirming Remove dependency changes only this example; Reset restores it. Navigation requests appear below instead of opening another page.</p>
    <button type="button" className="secondary" onClick={() => { setInstance(previous => ({ store: createWarningsStore(), revision: previous.revision + 1 })); setNavigation('Warning example reset.'); }}>Reset warning example</button>
    <p role="status" aria-live="polite">{navigation}</p>
    <div key={instance.revision} className="workspace module-warnings" data-testid="warning-example-content">
      <WarningsPanel store={instance.store} navigate={(module, entityId) => setNavigation(`Requested ${module}${entityId ? `: ${entityId}` : ''}`)} />
    </div>
  </section>;
}
