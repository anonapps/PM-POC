import { timelineDisplayDate } from "./timeline-date";

/** Shared footer presentation; callers retain their own navigation increments/end semantics. */
export function TimelineNavigation({label,start,end,previousLabel="← Previous",nextLabel="Next →",previousAriaLabel="Previous",nextAriaLabel="Next",context,onPrevious,onNext,onToday,todayDisabled}:{
  label:string;start:string;end:string;previousLabel?:string;nextLabel?:string;previousAriaLabel?:string;nextAriaLabel?:string;
  context?:string;onPrevious:()=>void;onNext:()=>void;onToday:()=>void;todayDisabled:boolean;
}) {
  return <footer className="timeline-navigation tube-navigation" role="navigation" aria-label={label}>
    <button type="button" className="secondary" aria-label={previousAriaLabel} onClick={onPrevious}>{previousLabel}</button>
    <span aria-live="polite" data-start={start} data-end={end}>{timelineDisplayDate(start)} – {timelineDisplayDate(end)}{context?` · ${context}`:""}</span>
    <button type="button" className="secondary" aria-label={nextAriaLabel} onClick={onNext}>{nextLabel}</button>
    <button type="button" className="secondary" disabled={todayDisabled} onClick={onToday}>Jump to today</button>
  </footer>;
}
