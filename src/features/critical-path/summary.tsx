"use client";
import { useCriticalPath } from "./provider";
import { displayAnalysisDate as date } from "./model";
export function CriticalPathSummary({ onOpen }: { onOpen: () => void }) {
  const { snapshot } = useCriticalPath(), result = snapshot.result;
  const current = !snapshot.stale && snapshot.status !== "Unavailable";
  return <article className="card critical-path-overview"><button type="button" className="sort-heading critical-summary-link" onClick={onOpen} aria-label="Open Critical Path Analysis in Gantt"><h2>Critical Path</h2></button>{(snapshot.status === "Partial" || snapshot.status === "Unavailable") && <span className="analysis-status">{snapshot.status}</span>}<div className="critical-summary-counts"><p>Critical tasks <strong>{current ? result?.criticalTaskCount ?? "—" : "—"}</strong></p><p>Critical paths <strong>{current ? result?.pathCount ?? "—" : "—"}</strong></p></div><p>Calculated completion {current ? date(result?.completion) : "—"}{current && result?.provisional ? " · Provisional" : ""}</p>{snapshot.stale && <p className="muted">{snapshot.status === "Unavailable" ? "Open analysis to retry." : snapshot.result ? "Updating results… Previous results are outdated." : "Calculating results…"}</p>}{current && result?.provisional && <p className="muted">{result?.activities.filter(activity => !activity.datesReliable).length ?? 0} activities have unresolved dates; completion is provisional. Float and criticality are withheld where unreliable. Review in Gantt analysis.</p>}</article>;
}
