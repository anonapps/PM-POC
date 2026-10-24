import type { CSSProperties } from "react";

/** Shared body-only timeline marker; the chart supplies its horizontal position. */
export function TodayMarker({ left, label = "Today" }: { left: CSSProperties["left"]; label?: string }) {
  return <div className="timeline-today-marker" aria-label={label} style={{ left }} />;
}
