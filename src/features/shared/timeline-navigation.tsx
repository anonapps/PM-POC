import type { ReactNode } from "react";
import { timelineDisplayDate } from "./timeline-date";
import { ActionButton } from "./action-button";

/** Shared footer presentation; callers retain their own navigation increments/end semantics. */
export function TimelineNavigation({label,start,end,previousLabel="← Previous",nextLabel="Next →",previousAriaLabel="Previous",nextAriaLabel="Next",previousHint,nextHint,context,onPrevious,onNext,onToday,todayDisabled,legend,controls}:{
  legend?:ReactNode;controls?:ReactNode;label:string;start:string;end:string;previousLabel?:string;nextLabel?:string;previousAriaLabel?:string;nextAriaLabel?:string;
  previousHint?:string;nextHint?:string;context?:string;onPrevious:()=>void;onNext:()=>void;onToday:()=>void;todayDisabled:boolean;
}) {
  return <footer className="timeline-navigation tube-navigation" role="navigation" aria-label={label}><div className="timeline-navigation-legend-row">{legend}{context&&<small className="timeline-navigation-context">{context}</small>}</div>
    <div className="timeline-navigation-controls"><ActionButton type="button" variant="secondary" aria-label={previousAriaLabel} title={previousHint} onClick={onPrevious}>{previousLabel}</ActionButton>
    <span aria-live="polite" data-start={start} data-end={end}>{timelineDisplayDate(start)} – {timelineDisplayDate(end)}</span>
    <ActionButton type="button" variant="secondary" aria-label={nextAriaLabel} title={nextHint} onClick={onNext}>{nextLabel}</ActionButton>
    <ActionButton type="button" variant="secondary" disabled={todayDisabled} onClick={onToday}>Jump to today</ActionButton>
    {controls}</div>
  </footer>;
}

export function TimelineDateHeading({date, end, label, weekend, onNavigate}: {
  date: string; end?: string; label: string; weekend?: boolean; onNavigate: (date: string) => void;
}) {
  return <span className={weekend ? "weekend" : undefined} title={end ? `${date} – ${end}` : timelineDisplayDate(date)}>
    <button type="button" className="sort-heading timeline-date-heading" data-date={date}
      aria-label={`Jump to ${timelineDisplayDate(date)} (${label})`} onClick={() => onNavigate(date)}>{label}</button>
  </span>;
}
