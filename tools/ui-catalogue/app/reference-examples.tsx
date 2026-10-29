'use client';
import { EmptyState, Status } from '../../../src/features/shell/shell';
import { PredictiveDisclosure } from '../../../src/features/shared/predictive-disclosure';
import { TodayMarker } from '../../../src/features/shared/today-marker';

/** Presentation specimens; native tooltip appearance remains browser/OS owned. */
export function ReferenceExamples() {
  return <section id="references" className="catalogue-section">
    <h2>References, messages and empty states</h2>
    <p className="catalogue-note">Real shared assets with example copy. Native title tooltips are inspected by pointer hover; their font and popup appearance are browser/OS controlled.</p>
    <div className="catalogue-grid">
      <div className="catalogue-sample"><h3>Status and native full-value help</h3>
        <Status>In Progress</Status>
        <p><button type="button" className="secondary" title="Full example text retained for a clipped value">Hover for full text</button></p>
        <small className="field-warning" role="status">Example duplicate-name warning.</small>
      </div>
      <div className="catalogue-sample"><h3>Anchored warning disclosure</h3>
        <PredictiveDisclosure className="gantt-warning"><summary aria-label="Example dependency warnings">⚠ 1</summary><ul className="anchored-options"><li>Example dependency dates are not scheduled.</li></ul></PredictiveDisclosure>
      </div>
      <div className="catalogue-sample"><h3>Empty results</h3>
        <EmptyState title="No example results" description="Change filters or reset the disposable examples."/>
      </div>
      <div className="catalogue-sample"><h3>Today reference</h3>
        <div className="catalogue-today-sample"><TodayMarker left="50%"/></div>
      </div>
    </div>
  </section>;
}
