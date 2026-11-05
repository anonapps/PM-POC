"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** An overlay: neither the trigger nor the toolbar participates in page layout. */
const blocked = () => [...document.querySelectorAll('[role="dialog"], [role="listbox"], [role="menu"], :popover-open, .filter-popover, details[open]')].some(element => element.checkVisibility({visibilityProperty:true})) || !!window.getSelection()?.toString();

export function FloatingToolbar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const priorFocus = useRef<HTMLElement | null>(null);
  const cancel = () => clearTimeout(timer.current);
  const close = useCallback((restore = false) => {
    cancel();
    if (restore && region.current?.contains(document.activeElement)) priorFocus.current?.focus();
    setOpen(false);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === "KeyT") {
        if (blocked()) return;
        event.preventDefault(); cancel();
        if (region.current?.dataset.open !== "true") priorFocus.current = document.activeElement as HTMLElement;
        setOpen(true);
        requestAnimationFrame(() => region.current?.querySelector<HTMLElement>('[role="toolbar"]')?.focus());
      } else if (event.key === "Escape" && region.current?.dataset.open === "true") {
        event.preventDefault(); close(true);
      }
    };
    const outside = (event: PointerEvent) => { if (!region.current?.contains(event.target as Node)) close(); };
    const drag = () => close();
    window.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("dragstart", drag);
    return () => { cancel(); window.removeEventListener("keydown", key); document.removeEventListener("pointerdown", outside, true); document.removeEventListener("dragstart", drag); };
  }, [close]);
  return <div ref={region} className="global-toolbar-region" data-open={open}
    onPointerLeave={() => { cancel(); if (!region.current?.contains(document.activeElement)) timer.current = setTimeout(() => close(), 300); }}
    onBlur={event => { if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) && !event.currentTarget.matches(':hover')) close(); }}>
    <div className="global-toolbar-trigger" aria-hidden="true" onPointerEnter={event => {
      cancel(); if (event.buttons || event.pointerType === "touch" || blocked()) return;
      timer.current = setTimeout(() => { if (!blocked()) { priorFocus.current = document.activeElement as HTMLElement; setOpen(true); } }, 300);
    }} onPointerDown={() => close()} />
    <div role="toolbar" aria-label="Project actions" aria-keyshortcuts="Alt+Shift+T" tabIndex={-1}
      className="global-floating-toolbar" inert={!open} aria-hidden={!open} onPointerEnter={cancel}>
      {children}
    </div>
  </div>;
}
