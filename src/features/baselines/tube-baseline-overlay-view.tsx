import { ActionTooltip } from '../shared/action-icon-button';
import type { buildTubeBaselineOverlay } from './tube-baseline-overlay';

export function TubeBaselineOverlay({ overlay }: { overlay: ReturnType<typeof buildTubeBaselineOverlay> }) {
  return <>
    {overlay.extraStreams.map(stream => <div className="tube-line tube-baseline-only-line" key={stream.id} style={{ top: stream.top, height: stream.height }}>
      <span className="tube-baseline-only-label">{stream.label}</span><div />
    </div>)}
    {overlay.markers.map(marker => {
      const label = marker.descriptions.join('; ');
      return <ActionTooltip key={`${marker.streamId}:${marker.date}`} label={label}>
        <span role="img" tabIndex={0} aria-label={label} data-stream-id={marker.streamId} data-baseline-date={marker.date}
          className={`tube-baseline-overlay-marker${marker.x > 80 ? " label-left" : ""}`} style={{ left: `${marker.x}%`, top: marker.y }}>
          <span aria-hidden="true">◇{marker.descriptions.length > 1 && <sup>{marker.descriptions.length}</sup>}</span>
        </span>
      </ActionTooltip>;
    })}
  </>;
}
