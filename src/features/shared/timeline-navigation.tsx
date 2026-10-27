import type { ReactNode } from "react";
import { timelineDisplayDate } from "./timeline-date";

/** Shared footer presentation; callers retain their own navigation increments/end semantics. */
export function TimelineNavigation({label,start,end,previousLabel="← Previous",nextLabel="Next →",previousAriaLabel="Previous",nextAriaLabel="Next",previousHint,nextHint,context,onPrevious,onNext,onToday,todayDisabled,legend,controls}:{
  legend?:ReactNode;controls?:ReactNode;label:string;start:string;end:string;previousLabel?:string;nextLabel?:string;previousAriaLabel?:string;nextAriaLabel?:string;
  previousHint?:string;nextHint?:string;context?:string;onPrevious:()=>void;onNext:()=>void;onToday:()=>void;todayDisabled:boolean;
}) {
  return <footer className="timeline-navigation tube-navigation" role="navigation" aria-label={label}><div className="timeline-navigation-legend-row">{legend}{context&&<small className="timeline-navigation-context">{context}</small>}</div>
    <div className="timeline-navigation-controls"><button type="button" className="secondary" aria-label={previousAriaLabel} title={previousHint} onClick={onPrevious}>{previousLabel}</button>
    <span aria-live="polite" data-start={start} data-end={end}>{timelineDisplayDate(start)} – {timelineDisplayDate(end)}</span>
    <button type="button" className="secondary" aria-label={nextAriaLabel} title={nextHint} onClick={onNext}>{nextLabel}</button>
    <button type="button" className="secondary" disabled={todayDisabled} onClick={onToday}>Jump to today</button>
    {controls}</div>
  </footer>;
}
