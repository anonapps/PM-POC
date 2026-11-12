/** Include the exact target without changing filters, deletion settings or sort. */
export function revealFilteredRecord<T extends { id: string }>(records: readonly T[], visible: readonly T[], targetId?: string): readonly T[] {
  if (!targetId || visible.some(record => record.id === targetId) || !records.some(record => record.id === targetId)) return visible;
  const ids = new Set(visible.map(record => record.id));
  return records.filter(record => record.id === targetId || ids.has(record.id));
}

/** Scroll only vertical record scrollers, accounting for their sticky headings. */
export function revealRecordElement(record: HTMLElement) {
  // Focus the record, not an editable field: visiting a legacy lower-case name
  // must not trigger a normalizing blur/save when the user leaves again.
  record.tabIndex = -1;
  record.focus({ preventScroll: true });
  for (let parent = record.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    if (!/(auto|scroll)/.test(getComputedStyle(parent).overflowY) || parent.scrollHeight <= parent.clientHeight) continue;
    const viewport = parent.getBoundingClientRect();
    let top = viewport.top + parent.clientTop;
    const bottom = viewport.top + parent.clientTop + parent.clientHeight;
    for (const heading of parent.querySelectorAll<HTMLElement>('.page-toolbar,thead,th')) {
      if (getComputedStyle(heading).position !== 'sticky') continue;
      const box = heading.getBoundingClientRect();
      if (box.top <= top + 2) top = Math.max(top, box.bottom);
    }
    const box = record.getBoundingClientRect();
    if (box.top < top || box.bottom > bottom) parent.scrollTop += (box.top + box.bottom - top - bottom) / 2;
  }
}
