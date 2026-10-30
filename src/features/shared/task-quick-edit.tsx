"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { ProjectStore } from "../../application/store";
import { validScheduleDate } from "../../domain/baselines";
import { editTask } from "../tasks/commands";
import { HumanTextInput } from "./human-text";
import { ActionButton } from "./action-button";
import { filterPanelPosition } from "./filter-panel-position";

/** Shared canonical task editor. Analysis reserves an in-flow slot: never covers details. */
export function TaskQuickEdit({ store, taskId, onClose, onOpenTask, style, inline = false, overlayAnchor }: { store: ProjectStore; taskId: string; onClose: () => void; onOpenTask: () => void; style?: CSSProperties; inline?: boolean; overlayAnchor?: HTMLElement | null }) {
  const task = store.getState().tasks.find(t => t.id === taskId);
  const [name, setName] = useState(task?.name ?? ""), [start, setStart] = useState(task?.startDate ?? ""), [finish, setFinish] = useState(task?.endDate ?? "");
  const form = useRef<HTMLFormElement>(null);
  useLayoutEffect(() => {
    if (!inline || !form.current) return;
    const node = form.current;
    const reveal = () => { const rect = node.getBoundingClientRect(); if (rect.bottom > window.innerHeight - 12 || rect.top < 12) node.scrollIntoView({ block: "nearest" }); };
    // Parent selection/focus layout can scroll the row after this child mounts.
    // Reveal the reserved editor after that layout, and after divider resizing.
    const frame = requestAnimationFrame(reveal);
    const observer = new ResizeObserver(reveal);
    observer.observe(node);
    const results = node.closest(".analysis-results");
    if (results) observer.observe(results);
    window.addEventListener("resize", reveal);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", reveal); };
  }, [inline]);
  useLayoutEffect(() => {
    const node = form.current;
    if (inline || !overlayAnchor || !node) return;
    // Native top layer escapes chart overflow and lower sticky toolbars, while
    // retaining the DOM ancestry needed by the existing Quick Edit CSS.
    node.showPopover();
    node.style.inset = "auto";
    let frame = 0;
    const position = () => {
      if (!overlayAnchor.isConnected || !node.matches(":popover-open")) return;
      const placement = filterPanelPosition(overlayAnchor.getBoundingClientRect(), window.innerWidth, window.innerHeight, node.scrollHeight + 2, Math.min(340, window.innerWidth - 24));
      Object.assign(node.style, { left: `${placement.left}px`, width: `${placement.width}px`, maxHeight: `${placement.maxHeight}px` });
      node.style.top = `${Math.max(8, Math.min(placement.top, window.innerHeight - 8 - node.getBoundingClientRect().height))}px`;
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(position); };
    const observer = new ResizeObserver(schedule);
    observer.observe(node); observer.observe(overlayAnchor);
    const pane = overlayAnchor.closest(".gantt-pane");
    if (pane) observer.observe(pane);
    position(); schedule();
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      if (node.matches(":popover-open")) node.hidePopover();
      // Wait until navigation/unmount finishes before restoring the trigger.
      queueMicrotask(() => { if (!node.isConnected && overlayAnchor.isConnected) overlayAnchor.focus({ preventScroll: true }); });
    };
  }, [inline, overlayAnchor]);
  if (!task || task.deletion.isDeleted) return null;
  const invalid = Boolean(start && finish && finish < start);
  return <form ref={form} popover={overlayAnchor && !inline ? "manual" : undefined} onKeyDown={event => { if (overlayAnchor && !event.defaultPrevented && event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); } }} aria-label="Quick edit task" className={`gantt-quick-edit${inline ? " analysis-quick-edit" : ""}`} style={style} onSubmit={event => {
    event.preventDefault(); if (!name.trim() || invalid || [start, finish].some(date => date && !validScheduleDate(date))) return;
    const current = store.getState().tasks.find(t => t.id === taskId); if (current && !current.deletion.isDeleted) store.execute(editTask(taskId, { name, startDate: start || null, endDate: finish || null })); onClose();
  }}><strong className="quick-edit-heading">Quick edit task</strong><label className="quick-edit-field"><span>Name:</span><HumanTextInput aria-label="Task name" autoFocus required value={name} onChange={event => setName(event.target.value)}/></label><label className="quick-edit-field"><span>Start date:</span><input aria-label="Start date" type="date" value={start} onChange={event => setStart(event.target.value)}/></label><label className="quick-edit-field"><span>End date:</span><input aria-label="End date" type="date" min={start || undefined} value={finish} onChange={event => setFinish(event.target.value)}/></label>{invalid && <small role="alert">End date must not precede start date.</small>}<div className="actions"><ActionButton type="submit">Save</ActionButton><ActionButton type="button" variant="secondary" onClick={onOpenTask}>Open Task</ActionButton><ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton></div></form>;
}
