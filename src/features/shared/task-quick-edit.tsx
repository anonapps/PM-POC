"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { ProjectStore } from "../../application/store";
import { validScheduleDate } from "../../domain/baselines";
import { editTask } from "../tasks/commands";
import { HumanTextInput } from "./human-text";
import { ActionButton } from "./action-button";

/** Shared canonical task editor. Analysis reserves an in-flow slot: never covers details. */
export function TaskQuickEdit({ store, taskId, onClose, onOpenTask, style, inline = false }: { store: ProjectStore; taskId: string; onClose: () => void; onOpenTask: () => void; style?: CSSProperties; inline?: boolean }) {
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
  if (!task || task.deletion.isDeleted) return null;
  const invalid = Boolean(start && finish && finish < start);
  return <form ref={form} aria-label="Quick edit task" className={`gantt-quick-edit${inline ? " analysis-quick-edit" : ""}`} style={style} onSubmit={event => {
    event.preventDefault(); if (!name.trim() || invalid || [start, finish].some(date => date && !validScheduleDate(date))) return;
    const current = store.getState().tasks.find(t => t.id === taskId); if (current && !current.deletion.isDeleted) store.execute(editTask(taskId, { name, startDate: start || null, endDate: finish || null })); onClose();
  }}><strong className="quick-edit-heading">Quick edit task</strong><label className="quick-edit-field"><span>Name:</span><HumanTextInput aria-label="Task name" autoFocus required value={name} onChange={event => setName(event.target.value)}/></label><label className="quick-edit-field"><span>Start date:</span><input aria-label="Start date" type="date" value={start} onChange={event => setStart(event.target.value)}/></label><label className="quick-edit-field"><span>End date:</span><input aria-label="End date" type="date" min={start || undefined} value={finish} onChange={event => setFinish(event.target.value)}/></label>{invalid && <small role="alert">End date must not precede start date.</small>}<div className="actions"><ActionButton type="submit">Save</ActionButton><ActionButton type="button" variant="secondary" onClick={onOpenTask}>Open Task</ActionButton><ActionButton type="button" variant="secondary" onClick={onClose}>Cancel</ActionButton></div></form>;
}
