"use client";
import { useState } from "react";
import type { ProjectStore } from "../../application";
import { duplicate, restore, softDelete } from "../../application";
import { MILESTONE_STATUSES } from "../../domain";
import { EmptyState, Status } from "../shell/shell";
import { createMilestone, editMilestone } from "./commands";

export function MilestonesModule({ store }: { store: ProjectStore }) {
  const [showDeleted, setShowDeleted] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const state = store.getState();
  const milestones = state.milestones.filter((item) => showDeleted || !item.deletion.isDeleted);
  const add = () => { if (store.execute(createMilestone({ name, plannedDate: date, status: "Tentative", ownerId: null, scope: { kind: "project" }, relatedTaskIds: [] }))) { setName(""); setDate(""); } };
  return <section className="panel"><div className="title-row"><div><p className="eyebrow">Governance dates</p><h1>Milestones</h1></div><label className="toggle"><input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} /> Show Deleted</label></div><div className="inline-form"><label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button onClick={add}>Add Milestone</button></div>{milestones.length === 0 ? <EmptyState title="No milestones" description="Add a governance checkpoint to the roadmap." /> : <table><thead><tr><th>ID / name</th><th>Date</th><th>Status</th><th>Scope</th><th>Owner</th><th>Actions</th></tr></thead><tbody>{milestones.map((milestone) => <tr key={milestone.id}><td><small>{milestone.humanId}</small><input disabled={milestone.deletion.isDeleted} value={milestone.name} onChange={(event) => store.execute(editMilestone(milestone.id, { name: event.target.value }))} /></td><td><input type="date" disabled={milestone.deletion.isDeleted} value={milestone.plannedDate} onChange={(event) => store.execute(editMilestone(milestone.id, { plannedDate: event.target.value }))} /></td><td><select disabled={milestone.deletion.isDeleted} value={milestone.status} onChange={(event) => store.execute(editMilestone(milestone.id, { status: event.target.value as typeof milestone.status }))}>{MILESTONE_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td><td>{milestone.scope.kind === "project" ? "Project-wide" : `${milestone.scope.streamIds.length} streams`}</td><td>{state.people.find((person) => person.id === milestone.ownerId)?.name ?? "Unassigned"}</td><td>{milestone.deletion.isDeleted ? <button onClick={() => store.execute(restore("milestone", milestone.id))}>Restore</button> : <><Status>{milestone.status}</Status><button className="secondary" onClick={() => store.execute(duplicate("milestone", milestone.id))}>Duplicate</button><button className="danger" onClick={() => store.execute(softDelete("milestone", milestone.id))}>Delete</button></>}</td></tr>)}</tbody></table>}</section>;
}
